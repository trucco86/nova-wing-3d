import { plan, check } from './orchestrator.mjs';
import { requestReview, recordReview } from './agent-review.mjs';

try {
  const [action, target, ...flags] = process.argv.slice(2);
  let result;
  if (['request-review', 'record-review'].includes(action) && flags.length === 1) {
    result =
      action === 'request-review'
        ? requestReview({ runId: target, implementerId: flags[0] })
        : recordReview({ runId: target, requestId: flags[0] });
  } else if (['plan', 'check'].includes(action) && flags.every((flag) => flag === '--browser')) {
    const options = { spec: target, browser: flags.includes('--browser') };
    result = action === 'plan' ? plan(options) : check(options);
  } else
    throw new Error(
      'Uso: agent:orchestrate plan|check <spec> [--browser], request-review <runId> <implementerId>, record-review <runId> <requestId>',
    );
  console.log(JSON.stringify(result, null, 2));
  if (['blocked', 'changes-requested'].includes(result.status)) process.exitCode = 1;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
