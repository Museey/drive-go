# Font settings of the test environment

The screenshot goldens were recorded on a machine whose fontconfig draws text
without hinting and with grayscale anti-aliasing (`12-unhinted-grayscale.conf`)
and prefers Inter for system UI fonts (`56-prefer-inter.conf`). A stock Ubuntu
image draws text a little differently (2–3 % of every screenshot's pixels), so
CI installs these two files into `/etc/fonts/conf.d` (`.github/actions/setup`).

`conf.d.txt` and `families.txt` list that machine's `/etc/fonts/conf.d` and its
font families; CI stops if its own lists differ.

Hinting is not left to these files: headless Chromium picked full hinting in
CI's container whatever fontconfig said, so every test and tool starts it with
`--font-render-hinting=none` (`LAUNCH_OPTIONS` in `tests/support/config.mjs`),
which is what the goldens' machine used anyway.
