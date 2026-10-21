import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml } from './dom.js';

test('escapeHtml neutraliza etiquetas y comillas', () => {
    assert.equal(escapeHtml('<script>alert(1)</script>'), '&lt;script&gt;alert(1)&lt;/script&gt;');
    assert.equal(escapeHtml('"doble" y \'simple\''), '&quot;doble&quot; y &#39;simple&#39;');
    assert.equal(escapeHtml('a & b'), 'a &amp; b');
});

test('escapeHtml devuelve cadena vacía para null y undefined', () => {
    assert.equal(escapeHtml(null), '');
    assert.equal(escapeHtml(undefined), '');
});
