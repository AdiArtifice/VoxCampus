# PostCard Expand/Collapse Functionality Demo

## Overview
The `PostCard` component has been successfully modified to include expand/collapse functionality. Here's what was implemented:

## Changes Made

### 1. Added State Management
- Added `isExpanded` state to track whether the post content is expanded or collapsed
- Initially set to `false` to show only the title

### 2. Enhanced Content Rendering
- Created `extractTitle()` function to extract the first line or first 80 characters as the post title
- Modified `renderContent()` to conditionally render either:
  - **Collapsed state**: Title + "Show More" button
  - **Expanded state**: Full content + "Show Less" button

### 3. New Styles Added
```typescript
titleText: {
  padding: SIZES.sm,
  fontFamily: FONTS.body,
  fontSize: 16,
  fontWeight: '600',
  color: COLORS.black
},
showMoreButton: {
  paddingHorizontal: SIZES.sm,
  paddingBottom: SIZES.xs,
  alignSelf: 'flex-start'
},
showMoreText: {
  fontFamily: FONTS.body,
  fontSize: 14,
  color: COLORS.primary,
  fontWeight: '500'
},
showLessButton: {
  paddingHorizontal: SIZES.sm,
  paddingTop: SIZES.xs,
  alignSelf: 'flex-start'
},
showLessText: {
  fontFamily: FONTS.body,
  fontSize: 14,
  color: COLORS.primary,
  fontWeight: '500'
}
```

## How It Works

### Initial Render (Collapsed)
- Shows only the post title (first line or first 80 characters of content)
- Displays a "Show More" button below the title
- Title is styled with bold font weight to make it prominent

### Expanded State
- Shows the full post content with all text and links
- Displays a "Show Less" button below the content
- Users can click to collapse back to title view

### Title Extraction Logic
- Takes the first line if content has multiple lines
- If first line is > 80 characters, truncates at word boundary with "..."
- Falls back to "Untitled Post" if no content exists

## Test Data Added
Added sample posts to HomeScreen for testing:
1. "Exciting Tech Workshop" - Multi-paragraph post about a workshop
2. "Annual Cultural Fest Announcement" - Event announcement with details

## User Experience
- **Clean initial view**: Users see only post titles in the feed
- **On-demand expansion**: Users can choose which posts to read in full
- **Easy collapse**: Users can quickly return to title view
- **Consistent styling**: Buttons use theme colors and fonts

## Benefits
- **Improved feed scanning**: Users can quickly browse multiple post titles
- **Reduced visual clutter**: Long posts don't overwhelm the interface
- **Better performance**: Only expanded posts render full content
- **Enhanced UX**: Users have control over content visibility

The implementation maintains all existing functionality while adding the new expand/collapse feature seamlessly.