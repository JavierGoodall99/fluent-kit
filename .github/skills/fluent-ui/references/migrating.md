# Migrating an existing screen to Fluent v9 (read only for a migration task)

When the task is to bring a screen onto the system:

1. List what is on the screen: components, hard-coded values, v8 imports, custom CSS.
2. Replace v8 components with their v9 equivalents one at a time. Keep behavior unchanged.
3. Replace each hard-coded value with the matching token. If no token fits, stop and ask. Do not approximate.
4. Delete CSS that Fluent now covers. Keep only layout CSS expressed with tokens.
5. Summarize any remaining hard-coded values at the end.
