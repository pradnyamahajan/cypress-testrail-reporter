const Mocha = require('mocha');
const TestRailApi = require('./testrail-api');
const TestRailStatus = require('./testrail-status');
const TestRailCache = require('./testrail-cache');
const TestRailHelpers = require('./testrail-helpers');
const TestRailLogger = require('./testrail-logger');
const chalk = require('chalk');
const moment = require('moment');
const {
  EVENT_RUN_BEGIN,
  EVENT_RUN_END,
  EVENT_TEST_FAIL,
  EVENT_TEST_PASS,
  EVENT_TEST_PENDING,
  EVENT_SUITE_BEGIN,
  EVENT_SUITE_END
} = Mocha.Runner.constants;

const executionDateTime = moment().format('MMM Do YYYY, HH:mm (Z)');

// this reporter outputs test results, indenting two spaces per suite
class CypressTestRailReporter {

  results = [];
  testcaseIds = [];

  constructor(runner, options) {
    this.repOpts = this.validateOptions(options);
    this.api = new TestRailApi(this.repOpts);
    this.configureRunner(runner);
  }

  configureRunner(runner) {
    runner
      .once(EVENT_RUN_BEGIN, async () => {
        await this.createTestPlan();
      })
      .on(EVENT_TEST_PASS, async (test) => {
        await this.storeResults(TestRailStatus.passed, test, `Execution time: ${test.duration}ms`);
      })
      .on(EVENT_TEST_FAIL, async (test, err) => {
        await this.storeResults(TestRailStatus.failed, test, `${err.message}`);
      })
      .on(EVENT_TEST_PENDING, async (test, err) => {
        await this.storeResults(TestRailStatus.skipped, test, `${err.message}`);
      })
      .once(EVENT_RUN_END, async () => {
        await this.submitResults();
      });
  }

  /**
   * Method creates a new TestRail Plan if 'createPlan' is true in the options
   */
  async createTestPlan() {
    // check if we have already created and cached the ID
    // only create new if nothing already cached
    if (!TestRailCache.retrieve('planId') && this.repOpts.createPlan === true) {

      var name = `${repOpts.planName || 'Automated test plan'} ${executionDateTime}`;
      var description = `${repOpts.planDescription || 'For the Cypress run visit https://dashboard.cypress.io/#/projects/runs'}`

      if (this.repOpts.milestoneId) {
        await this.api.createPlan(name, description, milestoneId);
      } else {
        await this.api.createPlan(name, description);
      }

      // cache the TestRail Plan ID
      TestRailCache.store('planId', this.api.planId);
    } else {
      // use the cached TestRail Plan ID
      this.api.planId = this.repOpts.planId
      TestRailLogger.log(`using existing TestRail Plan with ID: '${this.api.planId}'`);
    }
  }


  async submitResults() {
    if (this.results.length == 0) {
      TestRailLogger.warn('No testcases were matched with TestRail. Ensure that your tests are declared correctly and titles contain matches to format of Cxxxx');
    } else {
      var name = `${this.repOpts.runName || 'Automated test run'} ${executionDateTime}`;
      var description = `${this.repOpts.runDescription || 'For the Cypress run visit https://dashboard.cypress.io/#/projects/runs'}`
      
      if(this.repOpts.usePlan === true){
        await this.api.createPlanEntry(name, description, this.testcaseIds);
      }else{
        await this.api.createRun(name, description, this.testcaseIds);
      }      
      await this.api.publishResults(this.results);

      var path = (this.repOpts.usePlan === true) ? `plans/view/${this.api.planId.toString()}` : `runs/view/${this.api.runId.toString()}`;
      TestRailLogger.log(`${this.results.length} Results are published to ${chalk.blue(`${this.repOpts.host}/index.php?/${path}`)}`);
    }
  }

  validateOptions(options) {
    if (!options) {
      throw new Error('Missing cypress.json');
    }
    var reporterOptions = options.reporterOptions;
    if (!reporterOptions) {
      throw new Error('Missing reporterOptions in cypress.json');
    }
    this.validate(reporterOptions, 'host');
    this.validate(reporterOptions, 'username');
    this.validate(reporterOptions, 'password');
    this.validate(reporterOptions, 'projectId');
    if (reporterOptions.usePlan === true) {
      this.validate(reporterOptions, 'planId');
      this.validate(reporterOptions, 'suiteId');
    }
    return reporterOptions;
  }

  validate(options, name) {
    if (options[name] == null) {
      throw new Error(`Missing ${name} value. Please update reporterOptions in cypress.json`);
    }
  }

  async storeResults(status, test, comment) {
    var caseIds = TestRailHelpers.titleToCaseIds(test.title);
    if (caseIds.length > 0) {
      var caseResults = caseIds.map(caseId => {
        return {
          case_id: caseId,
          status_id: status,
          comment: comment,
        };
      });
      this.results.push(...caseResults);
      this.testcaseIds.push(...caseIds);      
    }
  }
}

module.exports = CypressTestRailReporter;
