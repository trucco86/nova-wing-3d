# Native gameplay capture, isolated media branch

Source: 85be7afef80bc8753865f0796939c732536fad6c, version 1.27.150.
No merge, PR, deploy or publication. No gameplay source changes.

## Sample gate
Four separate eight-second scenes: sector 1 flight, sector 3 passage, sector 3 boss/robot, sector 4 reactor.
Advance the original game by 1/60 per frame and capture each at native canvas 3840x2160.
Original Web Audio is rendered offline; each audio suspension uses the Web Audio render quantum.
Verify original image hashes, encoded dimensions, frame count and nominal rate. These checks do not establish visual quality or perceptual audio sync.
Read target, threat and weak-point snapshots and send normal keyboard events.
Use only existing checkpoint/developer setup, disclose that setup. No health replenishment, damage mutations, skipped collisions, entity deletion or simulated victories.
Reject non-playing states and asteroid blockage; preserve diagnostic report on failure.
Visual review MUST check effective hits, actual destruction, camera occlusion, objects crossing the player, UI, and original audio timing.
No final-video claim and no full render before sample review.

## Remaining after sample
Tune reactive pilot from measured evidence; verify obstacle avoidance including city and reactor.
Record ten sectors in order, select 600 seconds / 36000 distinct frames.
Include varied real weapons, pods, strategic skills and pilots where appropriate.
Export NovaWing_Gameplay_10min_4K60.mp4 and a 1080p60 review copy.
Review every scene and the assembled video; verify audio and full duration.

## Current limitations
Capture script is an initial candidate, unexecuted when committed.
Controller uses conservative movement limits and partial snapshot telemetry, so it may fail editorial criteria.
Full campaign capture and assembly intentionally await the sample gate.
Hosted software rendering may exceed runner limits.
A nominal 60fps MP4 alone does not establish 60 unique gameplay frames.
