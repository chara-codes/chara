import { InlineMessageContent } from '../components/molecules/message-bubble/inline-message-content';

export const InlineToolCallsExample = () => {
  const exampleSegments = [
    {
      type: 'text' as const,
      content: "I'd be happy to check the weather in London for you! Let me fetch that information right now."
    },
    {
      type: 'tool-call' as const,
      content: '',
      toolCall: {
        id: 'toolu_01SBNNKc9Gq8ZAwFHJNiabXV',
        name: 'weather',
        arguments: { location: 'London' },
        status: 'success' as const,
        result: {
          data: { location: 'London', temperature: 78 }
        },
        timestamp: new Date().toISOString()
      }
    },
    {
      type: 'text' as const,
      content: "Well, well, well... looks like it's 78 degrees in London! That's practically tropical by British standards. The locals are probably fainting in the streets, calling it a \"scorcher\" and panic-buying electric fans that they'll use once and then store in the attic for the next decade.\n\nIn London, this kind of weather means you'll see the rare phenomenon of British people actually looking happy outdoors, awkwardly exposing pale limbs that haven't seen sunlight since last August, and parks filled with people who called in \"sick\" to work with a mysterious 24-hour \"temperature\" condition. How ironic!\n\nIs there anything else you'd like to know about the weather or any other location you're curious about?"
    }
  ];

  const pendingToolCallSegments = [
    {
      type: 'text' as const,
      content: "Let me search for information about React hooks for you."
    },
    {
      type: 'tool-call' as const,
      content: '',
      toolCall: {
        id: 'search_001',
        name: 'web_search',
        arguments: { query: 'React hooks useState useEffect' },
        status: 'in-progress' as const,
        timestamp: new Date().toISOString()
      }
    },
    {
      type: 'text' as const,
      content: " I'm currently searching for the most up-to-date information..."
    }
  ];

  const errorToolCallSegments = [
    {
      type: 'text' as const,
      content: "Let me try to fetch that file for you."
    },
    {
      type: 'tool-call' as const,
      content: '',
      toolCall: {
        id: 'file_001',
        name: 'read_file',
        arguments: { path: '/nonexistent/file.txt' },
        status: 'error' as const,
        result: {
          error: 'File not found: /nonexistent/file.txt'
        },
        timestamp: new Date().toISOString()
      }
    },
    {
      type: 'text' as const,
      content: " I apologize, but I couldn't access that file. It appears the file doesn't exist at the specified location."
    }
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Inline Tool Calls Examples</h2>
      
      <div style={{ marginBottom: '30px' }}>
        <h3>Successful Tool Call</h3>
        <div style={{ 
          background: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <InlineMessageContent segments={exampleSegments} isUser={false} />
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3>In-Progress Tool Call</h3>
        <div style={{ 
          background: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <InlineMessageContent segments={pendingToolCallSegments} isUser={false} />
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3>Failed Tool Call</h3>
        <div style={{ 
          background: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <InlineMessageContent segments={errorToolCallSegments} isUser={false} />
        </div>
      </div>
    </div>
  );
};

export default InlineToolCallsExample;