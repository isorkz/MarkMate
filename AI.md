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
│   └── config.json              # Configuration for AI (includes encrypted keys) 
├── .gitignore
└── your-notes/
```

## API Key Management

### Security Approach

API keys are **encrypted and stored locally** using a master password. This approach provides both security and convenience for multi-model setups.

### Master Password Setup

Set the master password environment variable:

```bash
export MARKMATE_MASTER_PASSWORD=your-secure-master-password
```

### Configuration File
The `config.json` file stores model configurations with encrypted API keys:
```json
{
  "models": [
    {
      "id": "model-001",
      "name": "GPT-4o",
      "provider": "openai",
      "model": "gpt-4o",
      "apiKey": "AES256GCM:salt:iv:tag:encrypted_openai_key",
      "baseURL": "https://api.openai.com/v1",
    }
  ],
  "currentModelId": "model-001",
  "options": {
    "temperature": 0.7,
  }
}
```