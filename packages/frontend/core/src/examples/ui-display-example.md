# UI Display Example - Clean Message Content

This document shows how multi-part messages are displayed in the interface, with only the main message content shown in the message bubble, while context items appear in the existing "Using context:" section.

## Example 1: Simple Text Message (Legacy Format)

**User Input:** "Analyze this code for performance issues"

**UI Display:**
```
┌─────────────────────────────────────────┐
│ User                            3:45 PM │
│                                         │
│ Analyze this code for performance       │
│ issues                                  │
└─────────────────────────────────────────┘
```

## Example 2: Text Message with File Context

**User Input:** "Analyze this code for performance issues"
**Context:** JavaScript file + Documentation

**UI Display:**
```
┌─────────────────────────────────────────┐
│ User                            3:45 PM │
│                                         │
│ Analyze this code for performance       │
│ issues                                  │
└─────────────────────────────────────────┘

Using context:
┌─────────────────────────────────────────┐
│ 📄 main.js                              │
│ function processData(arr) {             │
│   return arr.map(x => x * 2);           │
│ }                                       │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ 📄 documentation.pdf                    │
│ [PDF preview or content]                │
└─────────────────────────────────────────┘
```

## Example 3: Image Analysis Request

**User Input:** "What can you tell me about this design?"
**Context:** PNG image

**UI Display:**
```
┌─────────────────────────────────────────┐
│ User                            3:47 PM │
│                                         │
│ What can you tell me about this design? │
└─────────────────────────────────────────┘

Using context:
┌─────────────────────────────────────────┐
│ 📄 design-mockup.png                    │
│ ┌─────────────────────────────────────┐ │
│ │                                     │ │
│ │        [Design Preview]             │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## Example 4: Mixed Context Types

**User Input:** "Review this implementation against the requirements"
**Context:** Code snippet + Requirements document + Design mockup

**UI Display:**
```
┌─────────────────────────────────────────┐
│ User                            3:50 PM │
│                                         │
│ Review this implementation against the  │
│ requirements                            │
└─────────────────────────────────────────┘

Using context:
┌─────────────────────────────────────────┐
│ 📄 Implementation Code                  │
│ ```javascript                           │
│ function validateUser(user) {           │
│   return user.email && user.name;       │
│ }                                       │
│ ```                                     │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ 📄 requirements.pdf                     │
│ [PDF document content]                  │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ 📄 design-mockup.png                    │
│ [DESIGN MOCKUP PREVIEW]                 │
└─────────────────────────────────────────┘
```

## Key UI Principles

### 1. **Clean Message Display**
- The user's actual message text is displayed cleanly in the message bubble
- No concatenation with context items
- Clear visual hierarchy

### 2. **Existing Context Integration**
- Context items appear in the existing "Using context:" section below the message
- No duplication of context information
- Maintains existing context styling and behavior

### 3. **Context Item Display**
- Text Context: Shows formatted content with syntax highlighting in existing containers
- File Context: Shows file previews or indicators in existing containers
- Images: Display actual image previews
- PDFs: Show document indicators
- Other files: Show appropriate file type information

### 4. **Visual Consistency**
- Message bubbles contain only the main message content
- Context items maintain their existing visual styling
- Consistent spacing and typography across the interface
- No duplicate context sections

## Implementation Benefits

1. **Clear Message Intent**: User can see their exact message without context pollution
2. **No Duplication**: Context appears only in the existing "Using context:" section
3. **Scannable Interface**: Clean message bubbles with context displayed separately below
4. **Consistent Experience**: Maintains existing context display behavior
5. **Simplified UI**: No additional context sections cluttering the message area

## Data Flow

```
User Message + Context Items
          ↓
    Auto-included in API
          ↓
Multi-part Message Format
          ↓
    UI Extracts Main Content
          ↓
┌─────────────────────┐
│ Main message text   │ ← Message bubble shows only first text part
└─────────────────────┘

Using context:              ← Existing section shows context items
┌─────────────────────┐
│ • Text contexts     │
│ • File attachments  │
└─────────────────────┘
```

This approach provides a clean, intuitive interface that shows the user's intent clearly while leveraging the existing context display system.