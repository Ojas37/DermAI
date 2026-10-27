"""
DermAI - AI-Powered Dermatology Consultation Service
Version: 1.0.2
Created: 2025-03-31
Author: gaurav252005-ML
License: Proprietary
"""

from datetime import datetime
from typing import Dict, List, Optional
import os
import logging
from groq import Groq
from tenacity import retry, stop_after_attempt, wait_exponential
import sys
from flask import Blueprint, request, jsonify
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import models and extensions
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from extensions import db
from models.chat import ChatMessage

logger = logging.getLogger(__name__)

bp = Blueprint('chat', __name__)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DermAI:
    def __init__(self, api_key: Optional[str] = None):
        """Initialize DermAI with API key."""
        self.api_key = api_key or os.getenv('GROQ_API_KEY')
        if not self.api_key:
            logger.warning("No Groq API key provided - chat functionality will be limited")
            self.client = None
        else:
            self.client = self._initialize_client()
        self.system_message = (
            "You are DermAI, an expert dermatology AI consultation assistant. "
            "Always structure your response cleanly and concisely using Markdown headers, bullet points, and bold text. "
            "Use the following structure whenever discussing a skin condition:\n\n"
            "### 🔍 Overview & Identification\n"
            "A concise 1-2 sentence description of what the condition is and typical visual signs.\n\n"
            "### 🧴 Recommended OTC Treatments\n"
            "Bullet points with specific over-the-counter options (creams, sprays, active ingredients) and application instructions.\n\n"
            "### 🛡️ Daily Hygiene & Prevention\n"
            "Practical steps to relieve discomfort, stop the spread, and prevent recurrence.\n\n"
            "### ⚠️ When to See a Doctor (Red Flags)\n"
            "Bullet points with signs requiring an immediate healthcare provider visit.\n\n"
            "### ⚕️ Medical Disclaimer\n"
            "A brief 1-line reminder that this is educational advice and not a replacement for in-person diagnosis."
        )
        
    def _initialize_client(self) -> Optional[Groq]:
        """Initialize Groq client."""
        try:
            return Groq(api_key=self.api_key)
        except Exception as e:
            logger.error(f"Failed to initialize Groq client: {str(e)}")
            return None

    def _get_active_model(self) -> str:
        """Dynamically detect and return an active text chat model available on the user's Groq key."""
        preferred = [
            os.getenv('GROQ_MODEL'),
            'openai/gpt-oss-120b',
            'openai/gpt-oss-20b',
            'qwen/qwen3.8-27b',
            'llama-3.3-70b-versatile',
            'llama-3.1-8b-instant',
            'llama-3.1-70b-versatile'
        ]
        preferred = [m for m in preferred if m]
        if not self.client:
            return preferred[0] if preferred else 'openai/gpt-oss-120b'
        try:
            available_models = [m.id for m in self.client.models.list().data]
            for m in preferred:
                if m in available_models:
                    return m
            # If none matched, find any text chat model
            for m in available_models:
                m_lower = m.lower()
                if not any(k in m_lower for k in ['whisper', 'guard', 'orpheus', 'tts']):
                    return m
            return available_models[0]
        except Exception as e:
            logger.warning(f"Error querying Groq models: {e}")
            return preferred[0] if preferred else 'openai/gpt-oss-120b'

    def get_response(self, user_input: str, user_id: str) -> Dict[str, any]:
        """Get AI response for user input."""
        try:
            # Save user message
            self._save_message(user_id, "user", user_input)
            
            # Check if client is available
            if not self.client:
                response = "I'm sorry, but the AI chat service is currently unavailable. Please ensure the API key is configured properly."
            else:
                candidate_models = [
                    self._get_active_model(),
                    'openai/gpt-oss-120b',
                    'openai/gpt-oss-20b',
                    'qwen/qwen3.8-27b',
                    'llama-3.3-70b-versatile',
                    'llama-3.1-8b-instant'
                ]
                unique_candidates = []
                for m in candidate_models:
                    if m and m not in unique_candidates:
                        unique_candidates.append(m)

                completion = None
                last_err = None
                for candidate in unique_candidates:
                    try:
                        completion = self.client.chat.completions.create(
                            model=candidate,
                            messages=[
                                {"role": "system", "content": self.system_message},
                                {"role": "user", "content": user_input}
                            ],
                            temperature=0.7,
                            max_tokens=2048
                        )
                        break
                    except Exception as err:
                        last_err = err
                        logger.warning(f"Failed completion with model {candidate}: {err}")

                if not completion:
                    raise last_err or Exception("All available Groq models failed.")

                response = completion.choices[0].message.content
            
            # Save assistant message
            self._save_message(user_id, "assistant", response)
            
            return {
                "success": True,
                "response": response,
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Error getting response: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }

    def _save_message(self, user_id: str, role: str, content: str):
        """Save a message to the database."""
        try:
            message = ChatMessage(user_id=user_id, role=role, content=content)
            db.session.add(message)
            db.session.commit()
        except Exception as e:
            logger.error(f"Failed to save message: {str(e)}")
            db.session.rollback()
            raise

    def clear_conversation(self, user_id: str) -> Dict[str, any]:
        """Clear conversation history for user."""
        try:
            ChatMessage.query.filter_by(user_id=user_id).delete()
            db.session.commit()
            return {"success": True}
        except Exception as e:
            logger.error(f"Error clearing conversation: {str(e)}")
            db.session.rollback()
            return {"success": False, "error": str(e)}

# Initialize DermAI instance
derm_ai = DermAI()

# ===================== ROUTES =====================
@bp.route('/', methods=['POST'])
def chat():
    """Handle chat messages"""
    try:
        data = request.get_json()
        message = data.get('message', '').strip()
        user_id = data.get('user_id', 'anonymous')
        
        if not message:
            return jsonify({
                'success': False, 
                'error': 'Message is required'
            }), 400
        
        result = derm_ai.get_response(message, user_id)
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        return jsonify({
            'success': False, 
            'error': 'Internal server error'
        }), 500

@bp.route('/clear', methods=['POST'])
def clear_chat():
    """Clear chat history for a user"""
    try:
        data = request.get_json()
        user_id = data.get('user_id', 'anonymous')
        
        result = derm_ai.clear_conversation(user_id)
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in clear chat endpoint: {str(e)}")
        return jsonify({
            'success': False, 
            'error': 'Internal server error'
        }), 500

@bp.route('/history', methods=['GET'])
def get_chat_history():
    """Get chat history for a user"""
    try:
        user_id = request.args.get('user_id', 'anonymous')
        messages = ChatMessage.query.filter_by(user_id=user_id).order_by(ChatMessage.timestamp).all()
        
        return jsonify({
            'success': True,
            'messages': [msg.to_dict() for msg in messages]
        })
        
    except Exception as e:
        logger.error(f"Error getting chat history: {str(e)}")
        return jsonify({
            'success': False, 
            'error': 'Internal server error'
        }), 500

@bp.route('/health', methods=['GET'])
def chat_health():
    """Health check for chat service"""
    try:
        # Test database connection
        ChatMessage.query.first()
        return jsonify({
            'success': True,
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat()
        })
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return jsonify({
            'success': False,
            'status': 'unhealthy',
            'error': str(e)
        }), 500
