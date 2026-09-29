# USMC Chess — El Szaba

A browser chess game inspired by the supplied Marine Corps chessboard reference.

## Play

The website is published from `dist` through the included GitHub Pages workflow. In repository **Settings → Pages**, set **Source** to **GitHub Actions**, then run the **Publish chess website** workflow if necessary. The expected address is https://drszaba.github.io/usmc-chess/ after deployment succeeds.

Select a piece and a highlighted destination. Drag the 3D board to rotate and scroll to zoom. Choose a computer opponent or a friend on the same device. White moves first. The 2D board supports keyboard navigation and is also the automatic fallback when WebGL is unavailable.

Includes legal move validation, castling, en passant, selectable pawn promotion, checkmate/draw detection, move history, undo, board flipping, and a casual two-ply computer opponent. Chess rules use chess.js 1.4.0; 3D rendering uses Three.js 0.180.0. Dependencies and their licenses are included locally; no CDN, account, API key, or paid service is required.

## Design status

The playable figures are original stylized geometric 3D models. The September 2026 source photos for each role are available in the game's “Dr. Szaba's piece designs” gallery. The 3D meshes follow their uniforms and silhouettes, including fitted queen trousers, mixed-gender PFC pawns and knights, and rear pedestal rank plaques. They are not photorealistic reconstructions; exact front and rear photographic likeness would require custom sculpted and textured 3D assets.

The support button opens the supplied Cash App account `$Szaba`. A PayPal button is not configured because no PayPal payment link has been supplied.

Independent fan project, not affiliated with or endorsed by the U.S. Marine Corps.
