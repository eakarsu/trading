import React, { useState, useEffect, useRef } from 'react';
import { marketAnalysisAPI } from '../api/marketData';
import '../styles/pages/TradingAssistantPage.css';

const TradingAssistantPage = () => {
  const [conversations, setConversations] = useState([
    {
      id: 1,
      title: 'Trading Assistant',
      messages: [
        { 
          id: 1, 
          text: "Hello! I'm your AI Trading Assistant. I can help you with market analysis, trading strategies, portfolio optimization, and answer any questions about financial markets. How can I assist you today?", 
          sender: 'assistant', 
          timestamp: new Date() 
        }
      ],
      createdAt: new Date()
    }
  ]);
  const [activeConversationId, setActiveConversationId] = useState(1);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Get active conversation
  const activeConversation = conversations.find(conv => conv.id === activeConversationId) || conversations[0];
  const messages = activeConversation?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const setMessages = (newMessages) => {
    setConversations(prev => prev.map(conv => 
      conv.id === activeConversationId 
        ? { ...conv, messages: newMessages }
        : conv
    ));
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      // Get AI response from the backend
      const response = await marketAnalysisAPI.getAssistantResponse({
        message: inputValue,
        conversationHistory: messages,
        context: {}
      });

      const assistantMessage = {
        id: updatedMessages.length + 1,
        text: response.response,
        sender: 'assistant',
        timestamp: new Date()
      };

      setMessages([...updatedMessages, assistantMessage]);
    } catch (error) {
      console.error('Failed to get AI response:', error);
      const errorMessage = {
        id: updatedMessages.length + 1,
        text: "Sorry, I'm having trouble processing your request right now. Please try again later.",
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages([...updatedMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConversation = () => {
    const newConversation = {
      id: Date.now(),
      title: 'New Conversation',
      messages: [
        { id: 1, text: "Hello! I'm your AI Trading Assistant. How can I help you today?", sender: 'assistant', timestamp: new Date() }
      ],
      createdAt: new Date()
    };
    
    setConversations(prev => [...prev, newConversation]);
    setActiveConversationId(newConversation.id);
  };

  const handleDeleteConversation = (conversationId) => {
    if (conversations.length <= 1) {
      alert('You must have at least one conversation.');
      return;
    }
    
    setConversations(prev => prev.filter(conv => conv.id !== conversationId));
    
    if (activeConversationId === conversationId) {
      setActiveConversationId(conversations.find(conv => conv.id !== conversationId)?.id || conversations[0].id);
    }
  };

  const handleRenameConversation = (conversationId, newTitle) => {
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId 
        ? { ...conv, title: newTitle }
        : conv
    ));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="trading-assistant-page">
      <div className="container">
        <div className="assistant-header">
          <h1>Conversational Trading Assistant</h1>
          <div className="assistant-status">
            <div className="status-indicator online"></div>
            <div className="status-text">AI Assistant Online</div>
          </div>
        </div>
        
        <div className="assistant-content">
          <div className="chat-container">
            <div className="messages-container">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`message ${message.sender}`}
                >
                  <div className="message-content">
                    <div className="message-text">{message.text}</div>
                    <div className="message-time">{formatTime(message.timestamp)}</div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="message assistant">
                  <div className="message-content">
                    <div className="message-text typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="input-container">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about trading, market analysis, or your portfolio..."
                rows="3"
              />
              <button 
                className="send-button" 
                onClick={handleSend}
                disabled={isLoading || !inputValue.trim()}
              >
                Send
              </button>
            </div>
          </div>
          
          <div className="assistant-sidebar">
            <div className="sidebar-section">
              <h3>Quick Actions</h3>
              <div className="quick-actions">
                <button className="btn btn-outline" onClick={async () => {
                  setIsLoading(true);
                  try {
                    const response = await marketAnalysisAPI.getAssistantResponse({
                      message: "Please analyze my portfolio performance, diversification, and provide recommendations for optimization.",
                      conversationHistory: messages,
                      context: { action: 'portfolio_analysis' }
                    });

                    const assistantMessage = {
                      id: messages.length + 1,
                      text: response.response,
                      sender: 'assistant',
                      timestamp: new Date()
                    };
                    setMessages([...messages, assistantMessage]);
                  } catch (error) {
                    console.error('Failed to get AI portfolio analysis:', error);
                    const errorMessage = {
                      id: messages.length + 1,
                      text: "Sorry, I'm having trouble analyzing your portfolio right now. Please try again later.",
                      sender: 'assistant',
                      timestamp: new Date()
                    };
                    setMessages([...messages, errorMessage]);
                  } finally {
                    setIsLoading(false);
                  }
                }}>
                  Analyze Portfolio
                </button>
                <button className="btn btn-outline" onClick={async () => {
                  setIsLoading(true);
                  try {
                    const response = await marketAnalysisAPI.getAssistantResponse({
                      message: "Please provide a comprehensive market overview including major indices, sector performance, volatility indicators, and overall market sentiment.",
                      conversationHistory: messages,
                      context: { action: 'market_overview' }
                    });

                    const assistantMessage = {
                      id: messages.length + 1,
                      text: response.response,
                      sender: 'assistant',
                      timestamp: new Date()
                    };
                    setMessages([...messages, assistantMessage]);
                  } catch (error) {
                    console.error('Failed to get AI market overview:', error);
                    const errorMessage = {
                      id: messages.length + 1,
                      text: "Sorry, I'm having trouble getting the market overview right now. Please try again later.",
                      sender: 'assistant',
                      timestamp: new Date()
                    };
                    setMessages([...messages, errorMessage]);
                  } finally {
                    setIsLoading(false);
                  }
                }}>
                  Market Overview
                </button>
                <button className="btn btn-outline" onClick={async () => {
                  setIsLoading(true);
                  try {
                    const response = await marketAnalysisAPI.getAssistantResponse({
                      message: "Please provide personalized stock recommendations based on current market conditions, my portfolio, and risk tolerance. Include specific reasoning for each recommendation.",
                      conversationHistory: messages,
                      context: { action: 'stock_recommendations' }
                    });

                    const assistantMessage = {
                      id: messages.length + 1,
                      text: response.response,
                      sender: 'assistant',
                      timestamp: new Date()
                    };
                    setMessages([...messages, assistantMessage]);
                  } catch (error) {
                    console.error('Failed to get AI stock recommendations:', error);
                    const errorMessage = {
                      id: messages.length + 1,
                      text: "Sorry, I'm having trouble generating stock recommendations right now. Please try again later.",
                      sender: 'assistant',
                      timestamp: new Date()
                    };
                    setMessages([...messages, errorMessage]);
                  } finally {
                    setIsLoading(false);
                  }
                }}>
                  Stock Recommendations
                </button>
                <button className="btn btn-outline" onClick={async () => {
                  setIsLoading(true);
                  try {
                    const response = await marketAnalysisAPI.getAssistantResponse({
                      message: "Please conduct a comprehensive risk assessment of my portfolio including volatility analysis, beta calculation, maximum drawdown potential, and risk mitigation strategies.",
                      conversationHistory: messages,
                      context: { action: 'risk_assessment' }
                    });

                    const assistantMessage = {
                      id: messages.length + 1,
                      text: response.response,
                      sender: 'assistant',
                      timestamp: new Date()
                    };
                    setMessages([...messages, assistantMessage]);
                  } catch (error) {
                    console.error('Failed to get AI risk assessment:', error);
                    const errorMessage = {
                      id: messages.length + 1,
                      text: "Sorry, I'm having trouble performing the risk assessment right now. Please try again later.",
                      sender: 'assistant',
                      timestamp: new Date()
                    };
                    setMessages([...messages, errorMessage]);
                  } finally {
                    setIsLoading(false);
                  }
                }}>
                  Risk Assessment
                </button>
              </div>
            </div>
            
            <div className="sidebar-section">
              <h3>Recent Insights</h3>
              <div className="insights-list">
                <div className="insight-item">
                  <div className="insight-title">Tech Sector Momentum</div>
                  <div className="insight-description">Strong buying pressure detected</div>
                </div>
                <div className="insight-item">
                  <div className="insight-title">Portfolio Rebalancing</div>
                  <div className="insight-description">Suggested to reduce growth stock exposure</div>
                </div>
                <div className="insight-item">
                  <div className="insight-title">Market Sentiment</div>
                  <div className="insight-description">Bullish with score of 75/100</div>
                </div>
              </div>
            </div>
            
            <div className="sidebar-section">
              <h3>Assistant Capabilities</h3>
              <ul className="capabilities-list">
                <li>Market analysis and insights</li>
                <li>Portfolio recommendations</li>
                <li>Risk assessment</li>
                <li>Strategy optimization</li>
                <li>News sentiment analysis</li>
                <li>Technical indicator interpretation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingAssistantPage;
