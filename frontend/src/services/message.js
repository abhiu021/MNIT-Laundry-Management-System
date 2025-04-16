import api from './api';

// Get all messages for the current user
export const getAllMessages = async () => {
  try {
    console.log('Fetching all messages...');
    const response = await api.get('/messages');
    console.log('Messages fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching messages:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};

// Get direct messages between two users
export const getDirectMessages = async (userId) => {
  try {
    console.log('Fetching direct messages with user:', userId);
    const response = await api.get(`/messages/direct/${userId}`);
    console.log('Direct messages fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching direct messages:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};

// Send a direct message
export const sendDirectMessage = async (recipientId, content, subject = '') => {
  try {
    console.log('Sending message to:', recipientId);
    
    // Ensure recipientId is a string
    const recipientIdStr = String(recipientId);
    
    // Create the request data
    const requestData = {
      recipientId: recipientIdStr,
      content,
      subject
    };
    
    console.log('Request data being sent:', requestData);
    
    // Get token for logging
    const token = localStorage.getItem('token');
    console.log('Using auth token:', token ? 'Present' : 'Missing');
    
    // Make API call
    const response = await api.post('/messages/direct', requestData);
    console.log('Message sent successfully:', response.data);
    return response.data;
  } catch (error) {
    // Check for server errors with more detail
    if (error.response?.status === 500) {
      console.error('Server error (500) details:', {
        message: 'Internal server error occurred when sending message',
        possibleCauses: [
          'Backend server issue',
          'Database connection problems',
          'Schema validation error',
          'Malformed request data'
        ],
        requestData: {
          recipientId,
          contentLength: content?.length,
          hasSubject: !!subject
        },
        error: error.message,
        response: error.response?.data
      });
      
      // Try to get the response text directly to see if there's any useful information
      try {
        if (error.request && error.request.response) {
          console.error('Raw response text:', error.request.response);
          try {
            const parsed = JSON.parse(error.request.response);
            console.error('Parsed error response:', parsed);
          } catch (e) {
            console.error('Could not parse response as JSON');
          }
        }
      } catch (e) {
        console.error('Error examining raw response:', e);
      }
    }
  
    // Enhanced error logging
    const errorDetails = {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
    };
    
    if (error.config) {
      errorDetails.requestUrl = error.config.url;
      errorDetails.requestMethod = error.config.method;
      errorDetails.requestData = error.config.data;
    }
    
    console.error('Error sending message:', errorDetails);
    
    // Get these variables again for the fallback approach
    const token = localStorage.getItem('token');
    const recipientIdStr = String(recipientId);
    const fallbackRequestData = {
      recipientId: recipientIdStr,
      content,
      subject
    };
    
    // Try alternative approach on server error
    if (error.response?.status === 500) {
      try {
        console.log('Trying alternative fetch approach...');
        
        // Use fetch API as a fallback
        const fetchResponse = await fetch(`${api.defaults.baseURL}/messages/direct`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token,
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify(fallbackRequestData),
          credentials: 'include'
        });
        
        // Try to get response text even if not ok
        const responseText = await fetchResponse.text();
        console.log('Fetch fallback response text:', responseText);
        
        if (fetchResponse.ok) {
          try {
            const data = JSON.parse(responseText);
            console.log('Message sent successfully with fetch fallback:', data);
            return data;
          } catch (e) {
            console.error('Could not parse successful response:', e);
            return { success: true, message: 'Message sent but response not JSON parseable' };
          }
        } else {
          console.error('Fetch fallback failed with status:', fetchResponse.status);
          console.error('Response text:', responseText);
          throw new Error(`Fetch fallback failed with status ${fetchResponse.status}`);
        }
      } catch (fetchError) {
        console.error('Fetch fallback failed:', fetchError);
      }
    }
    
    throw error;
  }
};

// Mark messages from a specific sender as read
export const markMessagesAsRead = async (senderId) => {
  try {
    console.log('Marking messages as read from:', senderId);
    const response = await api.put(`/messages/read/${senderId}`);
    console.log('Messages marked as read successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error marking messages as read:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};

// Get unread message count
export const getUnreadCount = async () => {
  try {
    console.log('Fetching unread message count...');
    const response = await api.get('/messages/unread/count');
    console.log('Unread count fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching unread count:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};

// Get users based on role
export const getUsersByRole = async (role) => {
  try {
    console.log('Fetching users with role:', role);
    let endpoint;
    
    // Use the appropriate endpoint based on the role parameter
    if (role === 'admin') {
      endpoint = '/admin/users';
    } else if (role === 'staff') {
      endpoint = '/staff/users';
    } else if (role === 'students') {
      endpoint = '/users';
    } else {
      throw new Error(`Invalid role: ${role}`);
    }
    
    const response = await api.get(endpoint);
    console.log('Users fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};

// Test message service connectivity and endpoints
export const testMessageService = async () => {
  try {
    console.log('Testing message service...');
    
    // Test API configuration
    const apiConfig = {
      baseURL: api.defaults.baseURL,
      headers: api.defaults.headers,
      withCredentials: api.defaults.withCredentials
    };
    console.log('API Config:', apiConfig);
    
    // Test authentication
    const authStatus = {
      token: localStorage.getItem('token') ? 'Present' : 'Missing',
      user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : 'Missing'
    };
    console.log('Auth status:', authStatus);
    
    // Create comprehensive test results object
    let results = {
      timestamp: new Date().toISOString(),
      auth: authStatus,
      apiConfig,
      endpoints: {},
      serverStatus: {}
    };
    
    // First check server health
    try {
      const healthResponse = await api.get('/');
      results.serverStatus = {
        status: 'OK',
        statusCode: healthResponse.status,
        data: healthResponse.data
      };
    } catch (error) {
      results.serverStatus = {
        status: 'Failed',
        error: error.message,
        response: error.response?.data
      };
    }
    
    // Test messages endpoint
    try {
      const messagesResponse = await api.get('/messages');
      results.endpoints.messages = {
        status: 'OK',
        statusCode: messagesResponse.status,
        data: messagesResponse.data.slice(0, 2) // Only log first 2 for brevity
      };
    } catch (error) {
      results.endpoints.messages = {
        status: 'Failed',
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      };
    }
    
    // Test users endpoint
    try {
      const usersResponse = await api.get('/users');
      results.endpoints.users = {
        status: 'OK',
        statusCode: usersResponse.status,
        data: usersResponse.data.slice(0, 2) // Only log first 2 for brevity
      };
    } catch (error) {
      results.endpoints.users = {
        status: 'Failed',
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      };
    }
    
    // Test direct message POST endpoint with dummy data
    try {
      const testMessageData = {
        recipientId: '60d0fe4f5311236168a109ca', // Dummy ID
        content: "Test message from diagnostic tool",
        subject: "Test"
      };
      
      results.endpoints.directMessageEndpoint = {
        requestSent: testMessageData
      };
      
      try {
        const endpointCheckResponse = await api.options('/messages/direct');
        results.endpoints.directMessageEndpoint.optionsResponse = {
          status: endpointCheckResponse.status,
          headers: endpointCheckResponse.headers,
          data: endpointCheckResponse.data
        };
      } catch (error) {
        results.endpoints.directMessageEndpoint.optionsResponse = {
          error: error.message,
          status: error.response?.status
        };
      }
      
      // Don't actually send test message to avoid cluttering database
    } catch (error) {
      results.endpoints.directMessageEndpoint = {
        status: 'Failed',
        error: error.message
      };
    }
    
    console.log('Message service test results:', results);
    return results;
  } catch (error) {
    console.error('Error testing message service:', error);
    throw error;
  }
};

// Diagnose backend server issues
export const diagnoseBackendServer = async () => {
  console.log('Diagnosing backend server issues...');
  
  const results = {
    serverStatus: {},
    endpoints: {},
    messageTest: {},
    timestamp: new Date().toISOString()
  };
  
  try {
    // Check server root
    try {
      const rootResponse = await fetch(api.defaults.baseURL, {
        method: 'GET',
        credentials: 'include'
      });
      
      results.serverStatus.root = {
        status: rootResponse.status,
        ok: rootResponse.ok,
        statusText: rootResponse.statusText,
        headers: Object.fromEntries([...rootResponse.headers.entries()])
      };
    } catch (error) {
      results.serverStatus.root = {
        error: error.message
      };
    }
    
    // Test specific message endpoints with minimal authentication
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    if (token) {
      headers['x-auth-token'] = token;
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Test messages endpoint
    try {
      const messagesResponse = await fetch(`${api.defaults.baseURL}/messages`, {
        method: 'GET',
        headers,
        credentials: 'include'
      });
      
      results.endpoints.messages = {
        status: messagesResponse.status,
        ok: messagesResponse.ok,
        statusText: messagesResponse.statusText
      };
      
      if (messagesResponse.ok) {
        const data = await messagesResponse.json();
        results.endpoints.messages.data = Array.isArray(data) ? 
          `Success: received ${data.length} messages` : 
          'Success: received response but not an array';
      }
    } catch (error) {
      results.endpoints.messages = {
        error: error.message
      };
    }
    
    // Test server options for message POST endpoint
    try {
      const optionsResponse = await fetch(`${api.defaults.baseURL}/messages/direct`, {
        method: 'OPTIONS',
        credentials: 'include'
      });
      
      results.endpoints.messageDirectOptions = {
        status: optionsResponse.status,
        ok: optionsResponse.ok,
        statusText: optionsResponse.statusText,
        headers: Object.fromEntries([...optionsResponse.headers.entries()])
      };
    } catch (error) {
      results.endpoints.messageDirectOptions = {
        error: error.message
      };
    }
    
    // Test actual message sending with a test message
    try {
      // Try to get a user to message
      let userToMessage = null;
      try {
        const usersResponse = await fetch(`${api.defaults.baseURL}/users`, {
          method: 'GET',
          headers,
          credentials: 'include'
        });
        
        if (usersResponse.ok) {
          const users = await usersResponse.json();
          if (Array.isArray(users) && users.length > 0) {
            userToMessage = users[0];
          }
        }
      } catch (userError) {
        results.messageTest.userLookup = {
          error: userError.message
        };
      }
      
      if (userToMessage) {
        results.messageTest.targetUser = {
          id: userToMessage._id,
          name: userToMessage.name
        };
        
        // Try sending a test message
        const testMessagePayload = {
          recipientId: userToMessage._id,
          content: "Test message from diagnostic tool",
          subject: "Diagnostic Test"
        };
        
        try {
          const sendResponse = await fetch(`${api.defaults.baseURL}/messages/direct`, {
            method: 'POST',
            headers,
            body: JSON.stringify(testMessagePayload),
            credentials: 'include'
          });
          
          results.messageTest.sendTest = {
            status: sendResponse.status,
            ok: sendResponse.ok,
            statusText: sendResponse.statusText
          };
          
          // Try to get the response body even if not ok
          try {
            const responseText = await sendResponse.text();
            try {
              // Try to parse as JSON
              const responseJson = JSON.parse(responseText);
              results.messageTest.sendTest.response = responseJson;
            } catch {
              // If not JSON, just store the text
              results.messageTest.sendTest.responseText = responseText;
            }
          } catch (bodyError) {
            results.messageTest.sendTest.bodyError = bodyError.message;
          }
        } catch (sendError) {
          results.messageTest.sendTest = {
            error: sendError.message
          };
        }
      }
    } catch (testError) {
      results.messageTest.error = testError.message;
    }
    
    console.log('Backend diagnostic results:', results);
    return results;
  } catch (error) {
    console.error('Diagnostics failed:', error);
    return {
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// Check if the backend is actually responding
export const checkBackendConnection = async () => {
  console.log('Checking backend connection...');
  const results = {
    timestamp: new Date().toISOString(),
    apiBaseUrl: api.defaults.baseURL,
    connectionTests: {}
  };
  
  try {
    // Test 1: Basic fetch to root API endpoint
    try {
      const startTime = Date.now();
      const response = await fetch(api.defaults.baseURL, {
        method: 'GET',
        cache: 'no-cache',
        credentials: 'include'
      });
      const endTime = Date.now();
      
      results.connectionTests.rootEndpoint = {
        success: response.ok,
        status: response.status, 
        statusText: response.statusText,
        responseTime: endTime - startTime + 'ms'
      };
      
      // Try to get the response text
      try {
        const text = await response.text();
        results.connectionTests.rootEndpoint.bodyLength = text.length;
      } catch (e) {
        results.connectionTests.rootEndpoint.bodyError = e.message;
      }
    } catch (e) {
      results.connectionTests.rootEndpoint = {
        error: e.message,
        stack: e.stack
      };
    }
    
    // Test 2: Direct XHR connection to check for CORS/network issues
    try {
      const xhr = new XMLHttpRequest();
      const xhrPromise = new Promise((resolve, reject) => {
        xhr.onload = () => {
          resolve({
            status: xhr.status,
            statusText: xhr.statusText,
            responseLength: xhr.responseText.length
          });
        };
        xhr.onerror = () => {
          reject(new Error('XHR request failed'));
        };
        xhr.ontimeout = () => {
          reject(new Error('XHR request timed out'));
        };
      });
      
      xhr.open('GET', api.defaults.baseURL, true);
      xhr.timeout = 5000; // 5 seconds
      xhr.send();
      
      const xhrResult = await xhrPromise;
      results.connectionTests.xhrTest = {
        success: true,
        ...xhrResult
      };
    } catch (e) {
      results.connectionTests.xhrTest = {
        error: e.message
      };
    }
    
    // Test 3: Check DNS resolution (indirect)
    try {
      const url = new URL(api.defaults.baseURL);
      const domain = url.hostname;
      results.connectionTests.dns = {
        domain,
        checked: true
      };
      
      // We can't directly test DNS in browser, but we can attempt a HEAD request
      try {
        const startTime = Date.now();
        const headResponse = await fetch(url.origin, {
          method: 'HEAD',
          cache: 'no-cache'
        });
        const endTime = Date.now();
        
        results.connectionTests.dns.headRequest = {
          success: headResponse.ok,
          status: headResponse.status,
          responseTime: endTime - startTime + 'ms'
        };
      } catch (e) {
        results.connectionTests.dns.headRequest = {
          error: e.message
        };
      }
    } catch (e) {
      results.connectionTests.dns = {
        error: e.message
      };
    }
    
    // Final summary
    const allTests = Object.values(results.connectionTests);
    const successfulTests = allTests.filter(test => test.success).length;
    
    results.summary = {
      testsRun: allTests.length,
      successfulTests,
      backendReachable: successfulTests > 0
    };
    
    console.log('Backend connection test results:', results);
    return results;
  } catch (e) {
    console.error('Connection check failed:', e);
    return {
      error: e.message,
      stack: e.stack,
      timestamp: new Date().toISOString()
    };
  }
};

// Test all possible message sending formats to identify which one works
export const testMessageSendFormats = async (recipientId, testMessage = "Test message") => {
  if (!recipientId) {
    return { success: false, error: "No recipient ID provided" };
  }
  
  // Ensure string format
  const recipientIdStr = String(recipientId).trim();
  
  console.log("Running comprehensive message format tests to recipientId:", recipientIdStr);
  
  const token = localStorage.getItem('token');
  const results = [];
  
  // List of all format combinations to try
  const formatTests = [
    // Test 1: Basic format
    {
      endpoint: '/messages/direct',
      payload: { recipientId: recipientIdStr, content: testMessage },
      description: "Basic format"
    },
    // Test 2: With subject
    {
      endpoint: '/messages/direct',
      payload: { recipientId: recipientIdStr, content: testMessage, subject: "Test" },
      description: "With subject field"
    },
    // Test 3: Role-specific endpoint
    {
      endpoint: '/staff/messages/direct', 
      payload: { recipientId: recipientIdStr, content: testMessage },
      description: "Staff-specific endpoint"
    },
    // Test 4: Alternative field name 'receiver'
    {
      endpoint: '/messages/direct',
      payload: { receiver: recipientIdStr, content: testMessage },
      description: "Using 'receiver' field"
    },
    // Test 5: Multiple field names (both recipientId and receiver)
    {
      endpoint: '/messages/direct',
      payload: { recipientId: recipientIdStr, receiver: recipientIdStr, content: testMessage },
      description: "Multiple recipient field names"
    },
    // Test 6: With message type
    {
      endpoint: '/messages/direct',
      payload: { recipientId: recipientIdStr, content: testMessage, type: "direct" },
      description: "With message type field"
    },
    // Test 7: Alternative field name for content
    {
      endpoint: '/messages/direct',
      payload: { recipientId: recipientIdStr, message: testMessage },
      description: "Using 'message' field instead of 'content'"
    },
    // Test 8: Student-specific endpoint
    {
      endpoint: '/student/messages/direct',
      payload: { recipientId: recipientIdStr, content: testMessage },
      description: "Student-specific endpoint"
    },
    // Test 9: Object ID format handling
    {
      endpoint: '/messages/direct',
      payload: { recipientId: { $oid: recipientIdStr }, content: testMessage },
      description: "Object ID format"
    },
    // Test 10: Without credentials
    {
      endpoint: '/messages/direct',
      payload: { recipientId: recipientIdStr, content: testMessage },
      description: "Without credentials",
      omitCredentials: true
    }
  ];
  
  // Run all format tests
  for (const test of formatTests) {
    try {
      console.log(`Trying format: ${test.description}`);
      console.log('Payload:', test.payload);
      
      const response = await fetch(`${api.defaults.baseURL}${test.endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-auth-token': token,
          ...(test.omitCredentials ? {} : { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(test.payload),
        credentials: test.omitCredentials ? 'omit' : 'include'
      });
      
      let responseText = '';
      try {
        responseText = await response.text();
      } catch (e) {
        responseText = 'Could not get response text';
      }
      
      results.push({
        formatDescription: test.description,
        endpoint: test.endpoint,
        status: response.status,
        ok: response.ok,
        responseText
      });
      
      // If successful, highlight this in results
      if (response.ok) {
        console.log(`SUCCESS! Format ${test.description} worked!`);
      }
    } catch (err) {
      results.push({
        formatDescription: test.description,
        endpoint: test.endpoint,
        error: err.message
      });
    }
  }
  
  // Find any successful formats
  const successfulFormats = results.filter(r => r.ok);
  
  console.log("Message format test complete. Results:", {
    totalTested: formatTests.length,
    successfulFormats: successfulFormats.length,
    allResults: results
  });
  
  return {
    success: successfulFormats.length > 0,
    successfulFormats,
    allResults: results
  };
}; 