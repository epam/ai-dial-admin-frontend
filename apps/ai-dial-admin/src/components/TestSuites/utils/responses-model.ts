import { CREATE_RESPONSE_METHOD } from '@/src/components/TestSuites/constants/responses-method';
import { reseedRequestModels } from '@/src/components/TestSuites/utils/model-reseeding';
import { TestSuite } from '@/src/models/evaluation/test-suite';

/**
 * Rewrites `model` in every create-response request body so it names the suite's current target.
 *
 * DIAL's Responses API endpoint carries no deployment segment, so `model` is what selects the
 * deployment. Changing a suite's target otherwise leaves the old id in place and the suite keeps
 * invoking the previous deployment — silently, because that id still names a real one.
 *
 * Requests on any other method, and bodies that are form-data parts, are returned untouched.
 */
export const reseedResponsesModel = (suite: TestSuite, deploymentId: string): TestSuite => {
  return reseedRequestModels(suite, deploymentId, [CREATE_RESPONSE_METHOD]);
};
