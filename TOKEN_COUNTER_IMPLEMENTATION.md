# Token Counter Implementation Summary

## 🎯 What Has Been Added

I have successfully implemented a token counter that displays users' current token balance prominently in the application header.

### 1. **API Hook** (`web/src/lib/useTokenBalance.ts`)
✅ **React Hook for Token Balance**
- `useTokenBalance()` hook that fetches user's token balance from `/api/tokens/balance`
- Includes loading states, error handling, and automatic retries
- Graceful fallback to 0 balance if token system isn't set up yet
- Refetch functionality for updating balance after token consumption

### 2. **TokenBalance Component** (`web/src/components/ui/TokenBalance.tsx`)
✅ **Reusable UI Component**
- **Compact variant**: Small token icon + number (for header)
- **Full variant**: Card-style display with icon and label (for dashboard/account pages)
- **Responsive design**: Shows/hides label based on screen size
- **Interactive**: Clickable to navigate to plans page
- **Loading states**: Skeleton animation while fetching balance
- **Follows design system**: Uses existing color tokens and styling patterns

### 3. **Header Integration** (`web/src/shell/App.tsx`)
✅ **Prominent Display in Navigation**
- Token counter appears in header next to logout button
- Only shows for authenticated users
- Responsive behavior:
  - **Desktop**: Shows token count + "tokens" label
  - **Mobile**: Shows just the icon + number to save space
- Clicking the counter navigates to `/plans` page

### 4. **Design System Integration**
✅ **Consistent Styling**
- Uses existing CSS design tokens (`text-primary`, `text-secondary`, etc.)
- Follows component patterns from `stat-pill.tsx` and `badge.tsx`
- Includes hover states and transitions
- Added to component exports in `ui/index.ts`

## 🎨 Visual Features

**Token Counter Display:**
- 🪙 Token icon (custom SVG with crossed circle design)
- **Number**: User's current token balance (formatted with compact notation)
- **Label**: "tokens" (plural) or "token" (singular)
- **States**: Loading skeleton, error handling, zero balance

**Placement:**
- **Header**: Always visible when logged in
- **Clickable**: Takes users to paid plans page
- **Responsive**: Adapts to mobile/desktop layouts

## 🔄 Real-time Updates

The token counter will automatically update when:
- User logs in (fetches balance)
- Component mounts (initial fetch)
- Manual refetch (after token consumption)

To refresh the balance after token usage:
```javascript
import { useTokenBalance } from '../lib/useTokenBalance'

function MyComponent() {
  const { balance, refetch } = useTokenBalance()
  
  // After consuming tokens
  const handleTokenConsumption = async () => {
    await fetch('/api/tokens/consume', { ... })
    refetch() // Updates the counter
  }
}
```

## 📱 Responsive Behavior

| Screen Size | Display |
|-------------|---------|
| Mobile (< 640px) | Icon + number only |
| Desktop (≥ 640px) | Icon + number + "tokens" label |

## 🎉 Ready to Use!

The token counter is now:
- ✅ Integrated into the header navigation
- ✅ Responsive across all screen sizes
- ✅ Clickable to drive users to upgrade
- ✅ Styled consistently with your design system
- ✅ Handles loading and error states gracefully

Users will now always see their token balance in the top-right corner of the app, making them aware of their usage and encouraging upgrades when running low!