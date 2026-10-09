# Product

## Register

product

## Users

Payment engineers and QA testers integrating or verifying Thai PromptPay / EMV QR payments. They arrive with a QR in hand (on screen, in a photo, or as a raw string from logs) and need to know exactly what it encodes: which tags are present, which sub-tags sit where, whether the CRC is valid, and whether the payload matches the spec. In generate mode they need correct test QRs for a specific payment type (Tag 29 credit transfer or Tag 30 bill payment) without hand-computing TLV and CRC.

Typical context: desktop, mid-task, often switching between this tool, an IDE, and a spec document. Sometimes on a phone to scan a physical QR.

## Product Purpose

Decode, inspect, and generate PromptPay QR payloads with spec-level precision. Success means a developer can paste or scan a QR and, within seconds, trust the breakdown enough to debug their integration, or produce a valid test QR without opening the EMV spec.

## Brand Personality

Precise, technical, trustworthy. The interface behaves like a protocol inspector or measuring instrument: calm, exact, data-forward. It explains tags in plain terms without hiding the raw values. Confidence comes from accuracy and clarity, not decoration.

## Anti-references

- Generic SaaS fintech: sky-blue + indigo gradients, glow shadows, gradient brand tiles, card-wrapped everything, hero-style section headers with decorative icons.
- Anything that prioritizes looking "modern" over showing the data.

## Design Principles

1. **Raw data is the hero.** Tags, lengths, values, and CRC are first-class content, set in monospace and easy to copy. Friendly labels annotate the raw values; they never replace them.
2. **Show validity, not just content.** Every decoded or generated payload states whether it is spec-valid (CRC, mandatory sub-tags, length rules) and points at the exact field when it is not.
3. **Instrument, not showroom.** Density and precision over decoration. Visual weight goes to what the engineer is inspecting, not to chrome.
4. **Fast round-trips.** Scan, paste, generate, and re-inspect with minimal clicks; keyboard paths for the frequent actions.
5. **Earn trust through exactness.** Spec terminology used correctly and consistently; no vague "something went wrong".

## Accessibility & Inclusion

Target WCAG 2.2 AA: 4.5:1 text contrast (including muted labels and placeholders), visible focus on all interactive elements, full keyboard operation of scan/generate/history flows, status changes announced to screen readers, and `prefers-reduced-motion` respected. Validity states must not rely on color alone.
