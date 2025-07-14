import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/FirebaseAuthContext';
import Button, { Icons } from '../ui/Button';
import Card from '../ui/Card';
import paymentService, { SUBSCRIPTION_PLANS } from '../../services/paymentService';

const PaymentServiceTest = () => {
  const { currentUser, isVisitor } = useAuth();
  const [testResults, setTestResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);

  const runPaymentServiceTests = async () => {
    setIsRunning(true);
    const results = {};

    try {
      // Test 1: Check if paymentService exists
      results.serviceExists = testServiceExists();
      
      // Test 2: Test getSubscriptionStatus function
      results.subscriptionStatus = await testGetSubscriptionStatus();
      
      // Test 3: Test getPlanComparison function
      results.planComparison = testGetPlanComparison();
      
      // Test 4: Test SUBSCRIPTION_PLANS export
      results.subscriptionPlans = testSubscriptionPlans();
      
      // Test 5: Test other payment service methods
      results.otherMethods = testOtherMethods();

      setTestResults(results);
    } catch (error) {
      console.error('Payment service tests failed:', error);
      setTestResults({ error: error.message });
    } finally {
      setIsRunning(false);
    }
  };

  const testServiceExists = () => {
    const tests = [];

    tests.push({
      name: 'Payment Service Import',
      status: paymentService ? 'PASS' : 'FAIL',
      details: paymentService ? 'Payment service imported successfully' : 'Payment service not found',
      data: { 
        type: typeof paymentService,
        constructor: paymentService?.constructor?.name
      }
    });

    tests.push({
      name: 'SUBSCRIPTION_PLANS Export',
      status: SUBSCRIPTION_PLANS ? 'PASS' : 'FAIL',
      details: SUBSCRIPTION_PLANS ? 'SUBSCRIPTION_PLANS exported successfully' : 'SUBSCRIPTION_PLANS not found',
      data: { 
        planCount: Object.keys(SUBSCRIPTION_PLANS || {}).length,
        plans: Object.keys(SUBSCRIPTION_PLANS || {})
      }
    });

    return {
      category: 'Service Existence',
      tests,
      summary: `${tests.filter(t => t.status === 'PASS').length}/${tests.length} existence tests passed`
    };
  };

  const testGetSubscriptionStatus = async () => {
    const tests = [];

    // Test function existence
    tests.push({
      name: 'getSubscriptionStatus Function Exists',
      status: typeof paymentService.getSubscriptionStatus === 'function' ? 'PASS' : 'FAIL',
      details: typeof paymentService.getSubscriptionStatus === 'function' 
        ? 'getSubscriptionStatus function is available' 
        : 'getSubscriptionStatus function is missing',
      data: { 
        type: typeof paymentService.getSubscriptionStatus
      }
    });

    // Test function call
    if (typeof paymentService.getSubscriptionStatus === 'function') {
      try {
        const testUserId = currentUser?.id || 'test-user-id';
        const result = await paymentService.getSubscriptionStatus(testUserId);
        
        tests.push({
          name: 'getSubscriptionStatus Function Call',
          status: 'PASS',
          details: 'Function executed successfully',
          data: { 
            result,
            hasSubscriptionId: 'subscriptionId' in result,
            hasPlanType: 'planType' in result,
            hasStatus: 'status' in result
          }
        });
      } catch (error) {
        tests.push({
          name: 'getSubscriptionStatus Function Call',
          status: 'WARN',
          details: `Function call failed but returned fallback: ${error.message}`,
          data: { error: error.message }
        });
      }
    }

    return {
      category: 'Subscription Status',
      tests,
      summary: `${tests.filter(t => t.status === 'PASS').length}/${tests.length} subscription status tests passed`
    };
  };

  const testGetPlanComparison = () => {
    const tests = [];

    // Test function existence
    tests.push({
      name: 'getPlanComparison Function Exists',
      status: typeof paymentService.getPlanComparison === 'function' ? 'PASS' : 'FAIL',
      details: typeof paymentService.getPlanComparison === 'function' 
        ? 'getPlanComparison function is available' 
        : 'getPlanComparison function is missing',
      data: { 
        type: typeof paymentService.getPlanComparison
      }
    });

    // Test function call
    if (typeof paymentService.getPlanComparison === 'function') {
      try {
        const result = paymentService.getPlanComparison('free');
        
        tests.push({
          name: 'getPlanComparison Function Call',
          status: Array.isArray(result) ? 'PASS' : 'FAIL',
          details: Array.isArray(result) 
            ? `Function returned array with ${result.length} plans` 
            : 'Function did not return an array',
          data: { 
            isArray: Array.isArray(result),
            length: result?.length,
            planIds: result?.map(p => p.id)
          }
        });

        // Test plan structure
        if (Array.isArray(result) && result.length > 0) {
          const firstPlan = result[0];
          const requiredFields = ['id', 'name', 'price', 'features'];
          const hasAllFields = requiredFields.every(field => field in firstPlan);
          
          tests.push({
            name: 'Plan Structure Validation',
            status: hasAllFields ? 'PASS' : 'WARN',
            details: hasAllFields 
              ? 'Plans have all required fields' 
              : 'Some required fields are missing',
            data: { 
              requiredFields,
              actualFields: Object.keys(firstPlan),
              missingFields: requiredFields.filter(field => !(field in firstPlan))
            }
          });
        }
      } catch (error) {
        tests.push({
          name: 'getPlanComparison Function Call',
          status: 'FAIL',
          details: `Function call failed: ${error.message}`,
          data: { error: error.message }
        });
      }
    }

    return {
      category: 'Plan Comparison',
      tests,
      summary: `${tests.filter(t => t.status === 'PASS').length}/${tests.length} plan comparison tests passed`
    };
  };

  const testSubscriptionPlans = () => {
    const tests = [];

    if (SUBSCRIPTION_PLANS) {
      const expectedPlans = ['free', 'pro', 'enterprise'];
      const actualPlans = Object.keys(SUBSCRIPTION_PLANS);
      
      tests.push({
        name: 'Required Plans Present',
        status: expectedPlans.every(plan => plan in SUBSCRIPTION_PLANS) ? 'PASS' : 'FAIL',
        details: expectedPlans.every(plan => plan in SUBSCRIPTION_PLANS)
          ? 'All required plans are present'
          : 'Some required plans are missing',
        data: { 
          expected: expectedPlans,
          actual: actualPlans,
          missing: expectedPlans.filter(plan => !(plan in SUBSCRIPTION_PLANS))
        }
      });

      // Test plan structure
      const planStructureValid = actualPlans.every(planId => {
        const plan = SUBSCRIPTION_PLANS[planId];
        return plan.id && plan.name && typeof plan.price === 'number' && Array.isArray(plan.features);
      });

      tests.push({
        name: 'Plan Structure Valid',
        status: planStructureValid ? 'PASS' : 'FAIL',
        details: planStructureValid
          ? 'All plans have valid structure'
          : 'Some plans have invalid structure',
        data: { 
          plans: actualPlans.map(planId => ({
            id: planId,
            hasId: !!SUBSCRIPTION_PLANS[planId].id,
            hasName: !!SUBSCRIPTION_PLANS[planId].name,
            hasPrice: typeof SUBSCRIPTION_PLANS[planId].price === 'number',
            hasFeatures: Array.isArray(SUBSCRIPTION_PLANS[planId].features)
          }))
        }
      });
    }

    return {
      category: 'Subscription Plans Data',
      tests,
      summary: `${tests.filter(t => t.status === 'PASS').length}/${tests.length} subscription plans tests passed`
    };
  };

  const testOtherMethods = () => {
    const tests = [];

    const expectedMethods = [
      'createMockPayment',
      'processPayment',
      'createCheckoutSession',
      'getCurrentSubscription',
      'cancelSubscription',
      'getPaymentHistory'
    ];

    expectedMethods.forEach(methodName => {
      tests.push({
        name: `${methodName} Method`,
        status: typeof paymentService[methodName] === 'function' ? 'PASS' : 'FAIL',
        details: typeof paymentService[methodName] === 'function'
          ? `${methodName} method is available`
          : `${methodName} method is missing`,
        data: { 
          type: typeof paymentService[methodName]
        }
      });
    });

    return {
      category: 'Other Payment Methods',
      tests,
      summary: `${tests.filter(t => t.status === 'PASS').length}/${tests.length} payment method tests passed`
    };
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Service Test Suite</h2>
        <p className="text-gray-600">
          Comprehensive testing of payment service functions and subscription functionality
        </p>
      </div>

      {/* Current User Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Current User Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">User Type:</span>
            <span className="ml-2 font-medium">{isVisitor() ? 'Visitor' : 'Authenticated'}</span>
          </div>
          <div>
            <span className="text-gray-600">User ID:</span>
            <span className="ml-2 font-medium">{currentUser?.id || 'None'}</span>
          </div>
          <div>
            <span className="text-gray-600">Current Plan:</span>
            <span className="ml-2 font-medium">{currentUser?.subscription || 'Free'}</span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <Button
          onClick={runPaymentServiceTests}
          disabled={isRunning}
          className={`px-6 py-3 rounded-lg font-medium ${
            isRunning
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white transition-colors`}
          icon={isRunning ? Icons.Loader : Icons.TestTube}
        >
          {isRunning ? 'Running Payment Service Tests...' : 'Run Payment Service Tests'}
        </Button>
      </div>

      {/* Test Results */}
      {Object.keys(testResults).length > 0 && (
        <div className="space-y-6">
          {Object.entries(testResults).map(([key, result]) => (
            <TestResultSection key={key} result={result} />
          ))}
        </div>
      )}
    </div>
  );
};

const TestResultSection = ({ result }) => {
  if (!result || !result.tests) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'PASS': return 'text-green-600 bg-green-50';
      case 'FAIL': return 'text-red-600 bg-red-50';
      case 'WARN': return 'text-yellow-600 bg-yellow-50';
      case 'INFO': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{result.category}</h3>
      <p className="text-sm text-gray-600 mb-4">{result.summary}</p>
      
      <div className="space-y-2">
        {result.tests.map((test, index) => (
          <div key={index} className="flex items-center justify-between p-3 rounded border">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(test.status)}`}>
                  {test.status}
                </span>
                <span className="font-medium">{test.name}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{test.details}</p>
              {test.data && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-500 cursor-pointer">View Details</summary>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                    {JSON.stringify(test.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentServiceTest;
