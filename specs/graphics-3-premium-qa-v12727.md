# Graphics 3.0 — Premium Detail Vertical Slice (QA)

**Base:** Graphics 2.0 PR #175, v1.27.26. **Target:** v1.27.27, isolated QA branch only. No automatic DEV/HML/PROD promotion.

## Player-visible contract

- The **High** preset adds a second layer of 3D architecture in the orbital city: inset armor panels, terraces, luminous facade spines, copper rooftop fins and warm contrast signage. Every tower retains its original location; no decorative hitboxes are added.
- The player fighter gets premium micro-panels, mechanical vents, luminous tracks and thruster accents. All three chassis variants are supported. Changing graphics quality while playing changes visibility immediately, and changing chassis inherits the active preset.
- **Medium** retains the existing city and fighter geometry; **Auto** still resolves conservatively based on pointer/device memory. Saves, gameplay difficulty, collisions, targeting, and flight physics must remain unchanged.
- All additions use GPU instancing, constant draw-call budgets (city five draws per loop, fighter four), and a small shared material set. Do not add remote textures or a separate engine.
- This is **not** photorealism or a finished match to the concept illustration: bespoke PBR texture maps, real-time contact shadows, authored hero meshes, LOD, cinematic particles and a full lighting pass remain future vertical slices.

## Verification and gates

- Unit: finite transforms even at negative coordinates, count budgets, invalid input, medium/high visibility, all fighter variants.
- Browser: game launch, option toggle and persistence, ship switching, QA screenshot at 1366×768 and 844×390, 30-second fps/frame-time measurement in both profiles.
- Visual: confirm premium details are visible from gameplay camera and that near/far loops are seamless; verify no overbright bloom, z-fighting, unwanted signs in central gameplay corridor, or new mobile overlaps.
- Delivery: release:prepare v1.27.27, format, deterministic build, validate, 4/4 Playwright shards, source repair, and isolated preview on the **final SHA**.
- **No merge** until automated gates and human review of real browser screenshots + mobile performance.
