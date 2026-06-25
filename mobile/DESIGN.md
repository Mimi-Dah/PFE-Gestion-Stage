# StageFlow Mobile — Design System

## Palette de couleurs

Importer depuis `src/theme/colors.js` ou via `src/theme/index.js` :

```js
import { getColors } from '../theme/colors';
// ou
import { getColors } from '../theme';
```

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `bg` | `#F5F7FA` | `#0F172A` | Fond de tous les écrans |
| `bgCard` | `#FFFFFF` | `#1E293B` | Fond des cartes |
| `bgInput` | `#F1F5F9` | `#334155` | Fond des inputs (dark) |
| `text` | `#0F172A` | `#F8FAFC` | Texte principal |
| `textSub` | `#475569` | `#94A3B8` | Texte secondaire |
| `textMuted` | `#94A3B8` | `#64748B` | Texte discret, placeholders |
| `primary` | `#16A34A` | `#22C55E` | Vert StageFlow — boutons, liens, accents |
| `primarySoft` | `#DCFCE7` | `#052E16` | Fond icône dans ChoiceRow, badges verts doux |
| `border` | `#E2E8F0` | `#334155` | Bordures des cartes et inputs |
| `danger` | `#DC2626` | `#EF4444` | Erreurs, bouton destructif |
| `errorSurface` | `#FEE2E2` | `#450A0A` | Fond de la zone d'erreur serveur |
| `errorText` | `#DC2626` | `#FCA5A5` | Texte de la zone d'erreur serveur |
| `star` | `#FBBF24` | `#FBBF24` | Étoile favoris |
| `overlay` | `rgba(0,0,0,0.45)` | `rgba(0,0,0,0.65)` | Fond des modales |

---

## Typographie

Importer depuis `src/theme/tokens.js` :

```js
import { typography } from '../theme/tokens';
// Usage : <Text style={{ ...typography.h1, color: C.text }}>
```

| Token | fontSize | fontWeight | Usage |
|-------|----------|------------|-------|
| `h1` | 28 | 700 | Titres de page auth (Heading) |
| `h2` | 22 | 700 | Titres de page étudiant |
| `h3` | 20 | 700 | Titres de section dans les cartes |
| `body` | 15 | 400 | Texte courant |
| `label` | 14 | 600 | Labels de champs, noms d'offres |
| `caption` | 13 | 400 | Texte secondaire, dates |
| `small` | 12 | 400 | Badges, métadonnées |
| `button` | 16 | 600 | Texte dans les boutons |

---

## Espacement

```js
import { spacing } from '../theme/tokens';
// spacing.xs=4  sm=8  md=16  lg=24  xl=32  xxl=48
```

Règles d'usage :
- Padding interne des cartes : **20px** (`Card` par défaut)
- Padding horizontal des écrans : **20px** (`Screen` scroll)
- Gap entre cartes : **12-16px**
- Gap entre éléments dans une carte : **8-12px**

---

## Border radius

```js
import { radius } from '../theme/tokens';
// sm=8  md=12  lg=16  xl=24  pill=999
```

- Inputs : `radius.md` (12)
- Cards : `radius.lg` (16)
- Boutons : `radius.md` (12)
- Badges/pills : `radius.pill` (999)

---

## Ombres

```js
import { shadow } from '../theme/tokens';
// shadow.sm / shadow.md / shadow.lg
```

- Card en light mode : `shadow.md` (appliqué automatiquement par `<Card>`)
- Card en dark mode : `borderWidth: 1, borderColor: C.border` (automatique)

---

## Composants UI disponibles

Tous dans `src/components/ui/`. Import exemple :

```js
import Screen        from '../components/ui/Screen';
import Card          from '../components/ui/Card';
import Button        from '../components/ui/Button';
import Input         from '../components/ui/Input';
import Heading       from '../components/ui/Heading';
import Badge         from '../components/ui/Badge';
import StatusBadge   from '../components/ui/StatusBadge';
import ChoiceRow     from '../components/ui/ChoiceRow';
import SectionHeader from '../components/ui/SectionHeader';
import EmptyState    from '../components/ui/EmptyState';
import ErrorState    from '../components/ui/ErrorState';
import Divider       from '../components/ui/Divider';
import OfferCard     from '../components/ui/OfferCard';
import CandidatureCard from '../components/ui/CandidatureCard';
```

### `<Screen>`
Wrapper universel pour tous les écrans.
```jsx
<Screen>                             // non-scrollable
<Screen scroll>                      // ScrollView automatique (paddingH 20, paddingB 40)
<Screen scroll keyboardAware>        // + KeyboardAvoidingView
<Screen contentStyle={{ justifyContent: 'center' }}>  // centrage vertical
```

### `<Card>`
```jsx
<Card>contenu</Card>
<Card style={{ padding: 0 }}>       // override padding pour listes ChoiceRow
```

### `<Heading>`
Hero centré pour les pages auth.
```jsx
<Heading emoji="👋" title="Bon retour !" subtitle="Sous-titre explicatif" />
```

### `<Button>`
```jsx
<Button onPress={fn}>Label</Button>
<Button variant="outline" size="sm">Annuler</Button>   // primary | secondary | outline | ghost | danger
<Button size="lg" fullWidth loading={isPending}>Se connecter</Button>
```

### `<Input>`
```jsx
<Input
  label="Email"
  leftIcon="mail-outline"
  placeholder="votre@email.com"
  error={errors.email?.message}
  {...field}
/>
<Input secureTextEntry ... />   // active le toggle mot de passe
```

### `<Badge>` / `<StatusBadge>`
```jsx
<Badge label="Informatique" variant="info" />     // success | warning | danger | info | default
<StatusBadge status="En_attente" />               // mappe les statuts API → variante de Badge
```

### `<ChoiceRow>`
```jsx
// Dans une <Card style={{ padding: 0 }}><View style={{ paddingHorizontal: 16 }}>
<ChoiceRow icon="person-outline" label="Modifier le profil" onPress={fn} />
<ChoiceRow emoji="⭐" label="Mes favoris" onPress={fn} last />  // last supprime le Divider
```

### `<SectionHeader>`
```jsx
<SectionHeader title="Offres récentes" />
<SectionHeader title="Offres récentes" action="Voir tout" onAction={fn} />
```

### `<EmptyState>`
```jsx
<EmptyState emoji="📋" title="Aucune candidature" body="..." />
<EmptyState emoji="🔍" title="..." body="..." cta="Voir les offres" onCta={fn} />
```

### `<ErrorState>`
```jsx
<ErrorState message="Impossible de charger les offres." onRetry={refetch} />
```

### `<OfferCard>`
```jsx
<OfferCard
  title="Développeur React Native"
  company="TechCorp"
  location="Paris"
  domain="Informatique"
  contractType="Stage"
  tags={[{ label: 'Télétravail', variant: 'success' }]}
  isFavorite={false}
  onPress={fn}
  onToggleFavorite={fn}
/>
```

### `<CandidatureCard>`
```jsx
<CandidatureCard
  offerTitle="Développeur React Native"
  company="TechCorp"
  status="En_attente"
  date="2025-05-10"
  onPress={fn}
  onWithdraw={fn}     // bouton "Retirer" visible seulement si status === 'En_attente'
/>
```

---

## Ajouter un nouvel écran

1. **Wrapper de base** — utiliser `<Screen>` ou `<Screen scroll>` en racine
2. **Titre de page** — `<Text style={{ ...typography.h2, color: C.text }}>`
3. **Cartes** — `<Card>` pour regrouper les sections
4. **Titres de section** — `<SectionHeader title="..." />`
5. **Listes navigables** — `<ChoiceRow>` dans une `<Card style={{ padding:0 }}>`
6. **État vide** — `<EmptyState emoji="..." title="..." />`
7. **État d'erreur** — `<ErrorState message="..." onRetry={refetch} />`
8. **Chargement** — `<LoadingSpinner fullScreen />` ou `<LoadingSpinner />`
9. **Couleurs** — toujours via `const C = getColors(isDark)`, jamais hardcodées
10. **Typographie** — toujours via `typography.h1`, `typography.body`, etc.

### Template minimal

```jsx
import React from 'react';
import { View, Text } from 'react-native';
import useLayoutStore from '../../store/layoutStore';
import { getColors } from '../../theme/colors';
import { typography } from '../../theme/tokens';
import Screen      from '../../components/ui/Screen';
import Card        from '../../components/ui/Card';
import SectionHeader from '../../components/ui/SectionHeader';
import EmptyState  from '../../components/ui/EmptyState';

export default function MonNouvelEcran({ navigation }) {
  const isDark = useLayoutStore((s) => s.isDarkMode);
  const C = getColors(isDark);

  return (
    <Screen scroll>
      <View style={{ gap: 20 }}>
        <Text style={{ ...typography.h2, color: C.text }}>Titre de la page</Text>

        <Card>
          <SectionHeader title="Ma section" />
          {/* contenu */}
        </Card>

        {/* Si liste vide */}
        <EmptyState emoji="📋" title="Rien ici" body="Description de l'état vide." />
      </View>
    </Screen>
  );
}
```
