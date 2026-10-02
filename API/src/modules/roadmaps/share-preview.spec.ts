import { describe, expect, it } from 'vitest';
import { escapeHtml } from './share-preview.js';

describe('share preview', () => {
  it('escapes metadata before inserting it into HTML', () => {
    expect(escapeHtml(`<script>alert('x')</script> & "ok"`)).toBe(
      '&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt; &amp; &quot;ok&quot;',
    );
  });
});
