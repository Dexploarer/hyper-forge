# TypeScript Viewer Type Safety

## Critical Issue: Commit c7017ea TypeScript Errors

### What Happened

Commit c7017ea introduced TypeScript errors in ThemeSwitcher.tsx by:

1. Using wrong import type for EquipmentViewer
2. Mixing viewer ref types in union types
3. Passing incompatible union types to mode-specific functions
4. Animation type string mismatches between store and component

### The Specific Errors

#### Error 1: Wrong Import Type

```typescript
// ❌ WRONG - EquipmentViewer uses default export, not named export
import { EquipmentViewer } from "@/components/equipment/EquipmentViewer";

// ✅ CORRECT - Must use default import
import EquipmentViewer from "@/components/equipment/EquipmentViewer";
```

**Rule**: Always check if a component uses `export default` vs `export const`. Named imports fail on default exports.

#### Error 2: Union Ref Types Cannot Be Passed to Specific Functions

```typescript
// ❌ WRONG - Union type (armorViewerRef | weaponViewerRef) cannot be passed to mode-specific function
const viewerRef = useRef<ArmorViewerRef | WeaponViewerRef>(null);
viewerRef.current?.setAnimation("walking"); // TypeScript error!

// ✅ CORRECT - Use conditional logic to call mode-specific functions
const armorViewerRef = useRef<ArmorViewerRef>(null);
const weaponViewerRef = useRef<WeaponViewerRef>(null);

if (mode === "armor" && armorViewerRef.current) {
  armorViewerRef.current.setAnimation("walking");
} else if (mode === "weapon" && weaponViewerRef.current) {
  weaponViewerRef.current.setAnimation("walking");
}
```

**Rule**: Never pass union types to functions expecting specific types. Always use conditional logic to narrow types before calling mode-specific methods.

#### Error 3: Animation Type Mismatches

```typescript
// ❌ WRONG - Store uses string type, component expects literal union
type AnimationName = string; // In store
type AnimationName = "tpose" | "walking" | "running"; // In component

// ✅ CORRECT - Store and component must use same type definition
// Store: packages/core/src/stores/viewerStore.ts
export type AnimationName = "tpose" | "walking" | "running";

// Component: packages/core/src/components/equipment/EquipmentViewer.tsx
export type AnimationName = "tpose" | "walking" | "running";
```

**Rule**: Animation type values must be synchronized between store definitions and component props. Use literal union types, not generic strings.

### Root Cause Analysis

1. **Not running typecheck before committing** - The errors would have been caught by `bun run typecheck`
2. **Assuming import types** - Not verifying if exports are default vs named
3. **Over-simplifying ref types** - Using union types when conditional logic was needed
4. **Type definition drift** - Store and component had incompatible animation type definitions

### Prevention Checklist

Before completing ANY TypeScript changes:

- [ ] Run `bun run typecheck` and verify 0 errors
- [ ] Check import/export types match (default vs named)
- [ ] Verify ref types are compatible when passed to functions
- [ ] Test all conditional rendering paths have correct types
- [ ] Ensure shared types (like AnimationName) are consistent across files
- [ ] Never use union types when calling methods that expect specific types
- [ ] Use TypeScript strict mode - it catches these errors

### The Fix Pattern

When dealing with mode-specific viewer refs:

```typescript
// 1. Separate refs for each mode
const armorViewerRef = useRef<ArmorViewerRef>(null);
const weaponViewerRef = useRef<WeaponViewerRef>(null);

// 2. Conditional logic to narrow types
if (mode === 'armor' && armorViewerRef.current) {
  armorViewerRef.current.modeSpecificMethod();
} else if (mode === 'weapon' && weaponViewerRef.current) {
  weaponViewerRef.current.modeSpecificMethod();
}

// 3. Pass correct ref to each viewer
{mode === 'armor' && (
  <EquipmentViewer ref={armorViewerRef} mode="armor" />
)}
{mode === 'weapon' && (
  <EquipmentViewer ref={weaponViewerRef} mode="weapon" />
)}
```

### Key Takeaways

1. **TypeScript errors are bugs** - They must be fixed, never ignored
2. **Run typecheck before committing** - This catches errors early
3. **Default vs named exports matter** - Wrong import type causes runtime errors
4. **Union types need conditional narrowing** - Can't pass union to specific type
5. **Type definitions must sync** - Store and component types must match exactly
6. **Strict mode is your friend** - It catches subtle type incompatibilities

### Files Affected (Reference)

- `packages/core/src/components/common/ThemeSwitcher.tsx` - Main issue location
- `packages/core/src/components/equipment/EquipmentViewer.tsx` - Default export, AnimationName type
- `packages/core/src/stores/viewerStore.ts` - AnimationName type definition

### Related Documentation

See `.claude/rules/typecheck-before-complete.md` for the enforcement rule that prevents this issue.
