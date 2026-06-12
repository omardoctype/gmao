Travaille uniquement dans le dossier frontend.

Le projet est un frontend React pour une GMAO industrielle.

## Stack
- Vite
- React
- TypeScript
- React Router
- Axios
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod
- Recharts

## Architecture
- app
- components
- pages
- services
- hooks
- lib
- types
- routes
- context
- store
- utils

## Règles
- ne jamais toucher au dossier backend
- implémenter une seule étape à la fois
- garder un design professionnel, moderne, propre, sobre et industriel
- utiliser TypeScript strictement
- éviter le code dupliqué
- créer des composants réutilisables
- utiliser des formulaires propres avec validation
- garder un frontend maintenable et démontrable pour un PFE
- ne pas faire de refactoring massif sans demande explicite

## Responsive Design Requirements (VERY IMPORTANT)

All UI must follow a mobile-first responsive design approach.

### Breakpoints
- Mobile: 320px and above
- Tablet: 768px and above
- Desktop: 1024px and above

### Layout Rules
- Use mobile-first design principles
- Avoid fixed widths, prefer flexbox and grid
- Use Tailwind responsive classes: sm, md, lg, xl
- Ensure layouts adapt smoothly across all screen sizes
- No overflow or broken UI on small screens

### Navigation
- Sidebar must become a collapsible menu or drawer on mobile
- Navigation must remain accessible and usable on all devices

### Tables
- Tables must be horizontally scrollable on small screens
- Avoid breaking layout when many columns are present

### Forms
- Forms must be stacked vertically on mobile
- Inputs must be full width on small screens
- Maintain good spacing and readability

### Buttons & Interactions
- Buttons must be touch-friendly (sufficient size and spacing)
- Avoid small clickable areas
- Ensure accessibility on mobile devices

### UI Behavior
- Components must adapt responsively without layout shift issues
- Cards, grids, and charts must resize properly
- Use responsive spacing and typography

### Validation Requirement
- Before finalizing any UI, mentally test the layout on:
  - mobile
  - tablet
  - desktop
- Fix any responsiveness issue before completing the task
