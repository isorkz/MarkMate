# AI Configuration

## File Structure
```
workspace-root/
├── .ai/
│   ├── sessions/
│   │   ├── session-001.json
│   │   ├── session-002.json
│   │   └── session-003.json
│   ├── templates/
│   │   ├── writing-assistant.json
│   │   ├── code-helper.json
│   │   └── translator.json
│   └── config.json              # Configuration for AI (won't include sensitive info)
├── .gitignore
└── your-notes/
```

## API Key Management

### Security Approach
API keys are **never stored in files** for security reasons. Instead, they are managed using a layered approach:

### Key Storage Priority
1. **Session Memory** (highest priority)
   - Keys are stored only in application memory during runtime
   - Automatically cleared when application closes
   - Most secure option

2. **Environment Variable** (fallback)
   - Set environment variable: `MARKMATE_AI_KEY=your_api_key_here`
   - Automatically loaded at application startup
   - Convenient for regular users

3. **Manual Input** (last resort)
   - If no key found in memory or environment
   - Application prompts user to enter API key
   - Key is stored in session memory only

### Usage Examples

#### Option 1: Environment Variable (Recommended)
```bash
# Set environment variable (macOS/Linux)
export MARKMATE_AI_KEY=sk-your-openai-key-here

# Set environment variable (Windows)
set MARKMATE_AI_KEY=sk-your-openai-key-here
```

#### Option 2: Runtime Input
- Launch MarkMate
- When using AI features for the first time, enter your API key
- Key will be remembered for the current session only

### Configuration File
The `config.json` file stores non-sensitive model configurations:
```json
{
  "models": [
    {
      "id": "model-001",
      "name": "GPT-4o",
      "provider": "openai",
      "model": "gpt-4o",
      "baseURL": "https://api.openai.com/v1",
    }
  ],
  "currentModelId": "model-001",
  "options": {
    "temperature": 0.7,
  }
}
```

### Security Notes
- ✅ API keys are never written to disk
- ✅ Configuration files can be safely committed to git
- ✅ Each session requires fresh key input (unless environment variable is set)
- ✅ No risk of accidentally sharing sensitive information

## Streaming Architecture

### Data Flow

**For Electron version:**
```
UI → ElectronAdapter → IPC → AIHandler → AIService.streamChatForElectron() → return AsyncIterable<string>
```

**Challenge**: IPC cannot serialize callback functions
**Solution**: Event-based streaming with unique stream IDs

**For Web version:**
```
UI → WebAdapter → HTTP API → Router → AIService.streamChatForWeb() → return HTTP Response Stream
```
