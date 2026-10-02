-- Include node content/resources in discovery while preserving public visibility checks.
CREATE INDEX roadmaps_graph_search ON roadmaps USING gin(jsonb_to_tsvector('simple',graph,'["string"]'::jsonb));
