import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Container,
  useTheme,
  alpha,
  IconButton,
  Badge,
  InputAdornment,
  Tooltip,
  Card,
  CardHeader,
  Fade,
  Zoom,
} from '@mui/material';
import {
  Send as SendIcon,
  BugReport as DebugIcon,
  Message as MessageIcon,
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  DoNotDisturbOn as DndIcon,
  ManageAccounts as AdminIcon,
  Person as PersonIcon,
  School as StudentIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { testMessageService, sendDirectMessage, diagnoseBackendServer } from '../services/message';

const Messages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [debugResults, setDebugResults] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const theme = useTheme();
  const chatContainerRef = React.useRef(null);

  useEffect(() => {
    fetchMessages();
    fetchUsers();
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, selectedUser]);

  const fetchMessages = async () => {
    try {
      console.log('Fetching messages for user:', user._id);
      
      // Use direct fetch instead of api service
      const token = localStorage.getItem('token');
      const response = await fetch(`${api.defaults.baseURL}/messages`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'x-auth-token': token,
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch messages with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Messages fetched successfully:', data);
      setMessages(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages. Please try again.');
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      console.log('Fetching users for role:', user.role);
      
      // Use direct fetch instead of api service
      const token = localStorage.getItem('token');
      const response = await fetch(`${api.defaults.baseURL}/users`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'x-auth-token': token,
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch users with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Users fetched successfully:', data);
      setUsers(data.filter(u => u._id !== user._id));
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users. Please try again.');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;

    try {
      console.log('Sending message to:', selectedUser._id, 'with content:', newMessage);

      // Ensure we have a clean string value for the ID
      const recipientId = String(selectedUser._id).trim();
      
      // Try multiple approaches to send the message
      const attempts = [
        // Attempt 1: Standard format with messages endpoint
        {
          method: 'POST',
          url: `${api.defaults.baseURL}/messages/direct`,
          payload: { recipientId, content: newMessage, subject: "" }
        },
        // Attempt 2: Alternative format with slightly different payload structure
        {
          method: 'POST',
          url: `${api.defaults.baseURL}/messages/direct`,
          payload: { 
            recipient: recipientId, 
            recipientId,
            message: newMessage,
            content: newMessage,
            subject: "",
            type: "direct" 
          }
        },
        // Attempt 3: Try a student-specific endpoint if it exists
        {
          method: 'POST',
          url: `${api.defaults.baseURL}/student/messages/direct`,
          payload: { recipientId, content: newMessage, subject: "" }
        }
      ];

      let successfulResponse = null;
      let lastError = null;

      // Try each approach until one succeeds
      for (const attempt of attempts) {
        try {
          console.log(`Trying to send message with URL: ${attempt.url}`);
          console.log('Payload:', attempt.payload);
          
          const token = localStorage.getItem('token');
          const response = await fetch(attempt.url, {
            method: attempt.method,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'x-auth-token': token,
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(attempt.payload),
            credentials: 'include'
          });
          
          if (response.ok) {
            console.log('Message sent successfully with attempt:', attempt);
            successfulResponse = response;
            break;
          } else {
            const errorText = await response.text();
            console.warn(`Attempt failed with status ${response.status}:`, errorText);
            lastError = { status: response.status, text: errorText, attempt };
          }
        } catch (err) {
          console.error('Error with attempt:', err);
          lastError = { error: err, attempt };
        }
      }

      // If any attempt succeeded
      if (successfulResponse) {
        // Refresh messages
        await fetchMessages();
        // Clear the input
        setNewMessage('');
        // Clear any previous errors
        setError(null);
        return;
      }
      
      // If all attempts failed
      throw new Error(`All message sending attempts failed. Last error: ${lastError?.status || lastError?.error?.message}`);
    } catch (error) {
      console.error('Error sending message:', error);
      setError(`Failed to send message: ${error.message}. Please try again later.`);
      // Keep the message in the input so the user can try again without retyping
    }
  };

  const handleUserSelect = async (selectedUser) => {
    setSelectedUser(selectedUser);
    try {
      // Mark messages as read using direct fetch
      const token = localStorage.getItem('token');
      const response = await fetch(`${api.defaults.baseURL}/messages/read/${selectedUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-auth-token': token,
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.warn(`Failed to mark messages as read with status: ${response.status}`);
      }
      
      // Refresh messages to update read status
      await fetchMessages();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const runDebugTest = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any existing errors
      
      // Run both diagnostic tools
      const testResults = await testMessageService();
      const backendResults = await diagnoseBackendServer();
      
      setDebugResults({
        messageService: testResults,
        backendServer: backendResults,
        timestamp: new Date().toISOString()
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Debug test failed:', error);
      setError('Failed to run debug test: ' + error.message);
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <AdminIcon fontSize="small" />;
      case 'staff':
        return <PersonIcon fontSize="small" />;
      case 'student':
        return <StudentIcon fontSize="small" />;
      default:
        return <PersonIcon fontSize="small" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return theme.palette.error.main;
      case 'staff':
        return theme.palette.warning.main;
      case 'student':
        return theme.palette.primary.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUnreadCount = (userId) => {
    return messages.filter(msg => 
      msg.sender === userId && 
      msg.receiver === user._id && 
      !msg.read
    ).length;
  };

  if (loading && messages.length === 0 && users.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 2 }}>
      <Paper
        elevation={0}
        sx={{
          mb: 4,
          overflow: 'hidden',
          borderRadius: '16px',
          background: theme.palette.background.headerGradient || 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
        }}
      >
        <Box
          sx={{
            p: 4,
            color: 'white',
            position: 'relative',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '150px',
              height: '150px',
              opacity: 0.2,
              transform: 'translate(30%, -30%)',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)',
            }}
          />
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <MessageIcon sx={{ mr: 1, fontSize: '2rem' }} />
            <Typography variant="h4" fontWeight="bold">
              Messages
            </Typography>
          </Box>
          
          <Typography variant="body1" sx={{ maxWidth: '600px', opacity: 0.9 }}>
            Chat with administrators and staff members about your laundry bookings and services.
          </Typography>
        </Box>
      </Paper>
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 2, 
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
            borderRadius: '10px' 
          }}
        >
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Box mb={2}>
            <TextField
              fullWidth
              placeholder="Search contacts..."
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{
                bgcolor: 'white',
                borderRadius: '10px',
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                },
              }}
            />
          </Box>

          <Paper 
            elevation={0}
            sx={{
              height: '600px',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              overflow: 'hidden',
            }}
          >
            <Box 
              sx={{ 
                p: 2, 
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                bgcolor: alpha(theme.palette.primary.main, 0.03),
              }}
            >
              <Typography variant="subtitle1" fontWeight={600}>
                Contacts
              </Typography>
            </Box>
            
            <List 
              sx={{ 
                height: 'calc(600px - 56px)', 
                overflowY: 'auto',
                p: 0,
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  borderRadius: '3px',
                },
              }}
            >
              {filteredUsers.length === 0 ? (
                <Box p={3} textAlign="center" color="text.secondary">
                  <DndIcon sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} />
                  <Typography variant="body2">
                    No contacts found
                  </Typography>
                </Box>
              ) : (
                filteredUsers.map((contactUser) => {
                  const unreadCount = getUnreadCount(contactUser._id);
                  
                  return (
                    <React.Fragment key={contactUser._id}>
                      <ListItem 
                        button 
                        onClick={() => handleUserSelect(contactUser)}
                        selected={selectedUser?._id === contactUser._id}
                        sx={{
                          px: 2,
                          py: 1.5,
                          borderLeft: selectedUser?._id === contactUser._id 
                            ? `3px solid ${theme.palette.primary.main}` 
                            : '3px solid transparent',
                          bgcolor: selectedUser?._id === contactUser._id 
                            ? alpha(theme.palette.primary.main, 0.05)
                            : 'transparent',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.03),
                          },
                        }}
                      >
                        <ListItemAvatar>
                          <Badge
                            color="error"
                            badgeContent={unreadCount}
                            invisible={unreadCount === 0}
                            overlap="circular"
                          >
                            <Avatar
                              sx={{
                                bgcolor: alpha(getRoleColor(contactUser.role), 0.1),
                                color: getRoleColor(contactUser.role),
                                fontWeight: 'bold',
                              }}
                            >
                              {getInitials(contactUser.name)}
                            </Avatar>
                          </Badge>
                        </ListItemAvatar>
                        
                        <ListItemText 
                          primary={
                            <Typography 
                              variant="body1" 
                              fontWeight={500}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              {contactUser.name}
                              <Tooltip title={contactUser.role || 'User'}>
                                <Box 
                                  component="span" 
                                  sx={{ 
                                    color: getRoleColor(contactUser.role),
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontSize: '0.8rem'
                                  }}
                                >
                                  {getRoleIcon(contactUser.role)}
                                </Box>
                              </Tooltip>
                            </Typography>
                          }
                          secondary={
                            <Typography 
                              variant="body2" 
                              color="textSecondary"
                              noWrap
                              sx={{ maxWidth: '180px' }}
                            >
                              {contactUser.email || contactUser.role || 'User'}
                            </Typography>
                          }
                        />
                      </ListItem>
                      <Divider component="li" variant="inset" />
                    </React.Fragment>
                  );
                })
              )}
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper 
            elevation={0}
            sx={{
              height: '600px',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {selectedUser ? (
              <>
                <Box 
                  sx={{ 
                    p: 2, 
                    display: 'flex',
                    alignItems: 'center',
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    bgcolor: alpha(theme.palette.primary.main, 0.03),
                  }}
                >
                  <IconButton 
                    size="small" 
                    sx={{ 
                      mr: 1,
                      display: { xs: 'flex', md: 'none' },
                      color: theme.palette.text.secondary
                    }}
                    onClick={() => setSelectedUser(null)}
                  >
                    <ArrowBackIcon />
                  </IconButton>
                  
                  <Avatar
                    sx={{
                      bgcolor: alpha(getRoleColor(selectedUser.role), 0.1),
                      color: getRoleColor(selectedUser.role),
                      fontWeight: 'bold',
                      mr: 1.5,
                      width: 40,
                      height: 40,
                    }}
                  >
                    {getInitials(selectedUser.name)}
                  </Avatar>
                  
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {selectedUser.name}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="textSecondary"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {getRoleIcon(selectedUser.role)}
                      {selectedUser.role || 'User'}
                    </Typography>
                  </Box>
                </Box>
                
                <Box 
                  ref={chatContainerRef}
                  sx={{ 
                    p: 3, 
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    flexGrow: 1,
                    bgcolor: alpha(theme.palette.background.default, 0.5),
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                    '&::-webkit-scrollbar': {
                      width: '6px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      borderRadius: '3px',
                    },
                  }}
                >
                  {messages
                    .filter(msg => 
                      (msg.sender === user._id && msg.receiver === selectedUser._id) ||
                      (msg.sender === selectedUser._id && msg.receiver === user._id)
                    )
                    .map((message, index) => {
                      const isSentByMe = message.sender === user._id;
                      
                      return (
                        <Zoom in={true} key={message._id} style={{ transitionDelay: `${index * 50}ms` }}>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: isSentByMe ? 'flex-end' : 'flex-start',
                              mb: 1,
                            }}
                          >
                            <Paper
                              sx={{
                                p: 2,
                                maxWidth: '75%',
                                bgcolor: isSentByMe 
                                  ? alpha(theme.palette.primary.main, 0.9) 
                                  : 'white',
                                color: isSentByMe ? 'white' : 'inherit',
                                borderRadius: isSentByMe 
                                  ? '16px 16px 4px 16px' 
                                  : '16px 16px 16px 4px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                position: 'relative',
                              }}
                            >
                              <Typography variant="body1">
                                {message.content}
                              </Typography>
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  opacity: 0.7,
                                  display: 'block',
                                  textAlign: 'right',
                                  mt: 0.5,
                                }}
                              >
                                {formatTimestamp(message.createdAt)}
                              </Typography>
                            </Paper>
                          </Box>
                        </Zoom>
                      );
                    })}
                    
                  {messages.filter(msg => 
                    (msg.sender === user._id && msg.receiver === selectedUser._id) ||
                    (msg.sender === selectedUser._id && msg.receiver === user._id)
                  ).length === 0 && (
                    <Box 
                      sx={{ 
                        p: 3, 
                        textAlign: 'center', 
                        color: 'text.secondary',
                        mt: 8
                      }}
                    >
                      <MessageIcon sx={{ fontSize: 40, opacity: 0.2, mb: 1 }} />
                      <Typography variant="body2">
                        No messages yet. Start the conversation!
                      </Typography>
                    </Box>
                  )}
                </Box>
                
                <Box 
                  sx={{ 
                    p: 2, 
                    borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    bgcolor: 'white',
                    display: 'flex',
                    gap: 1,
                  }}
                >
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    multiline
                    maxRows={4}
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '20px',
                        bgcolor: alpha(theme.palette.background.default, 0.8),
                      },
                    }}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    sx={{
                      borderRadius: '20px',
                      minWidth: '56px',
                      px: 2,
                    }}
                  >
                    <SendIcon />
                  </Button>
                </Box>
              </>
            ) : (
              <Box 
                display="flex" 
                flexDirection="column"
                justifyContent="center" 
                alignItems="center" 
                height="100%"
                p={3}
              >
                <MessageIcon sx={{ fontSize: 60, color: alpha(theme.palette.primary.main, 0.2), mb: 2 }} />
                <Typography variant="h6" color="textSecondary" align="center" gutterBottom>
                  Select a contact to start chatting
                </Typography>
                <Typography variant="body2" color="textSecondary" align="center" sx={{ maxWidth: '60%' }}>
                  Stay in touch with staff and administrators about your laundry services
                </Typography>
              </Box>
            )}
          </Paper>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button 
              startIcon={<DebugIcon />} 
              variant="outlined" 
              onClick={runDebugTest}
              color="primary"
              size="small"
              sx={{ 
                borderRadius: '20px',
                textTransform: 'none',
              }}
            >
              Diagnose Issues
            </Button>
          </Box>
        </Grid>
      </Grid>
      
      {debugResults && (
        <Fade in={!!debugResults}>
          <Paper 
            sx={{ 
              mt: 3, 
              p: 2, 
              maxHeight: '300px', 
              overflow: 'auto',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            }}
          >
            <Typography variant="subtitle2" gutterBottom fontWeight={600}>Debug Results:</Typography>
            <Box 
              sx={{ 
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                borderRadius: '8px',
                p: 1.5,
                bgcolor: alpha(theme.palette.background.default, 0.5),
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                whiteSpace: 'pre-wrap',
              }}
            >
              {JSON.stringify(debugResults, null, 2)}
            </Box>
          </Paper>
        </Fade>
      )}
    </Container>
  );
};

export default Messages; 