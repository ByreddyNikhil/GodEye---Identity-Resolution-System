# TODO: Implement Identity Resolution Enhancements

- [x] Update database/schema.sql to add relationship_type column to identity_edges with 'MATCH' and 'NON_MATCH'
- [x] Add audit_trails table to database/schema.sql for merge/split history
- [x] Modify scripts/confidence-scoring.js to implement two-model strategy (conservative and exploratory)
- [x] Add caching logic to mcp-server/server.js for platform responses with TTL
- [x] Update web-ui/src/App.js to include manual split functionality
- [ ] Test updated confidence scoring and database changes
- [ ] Verify caching prevents unnecessary re-validation
- [ ] Ensure audit trails are maintained for merges/splits
