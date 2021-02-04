const axios = require('axios');
const TestRailCache = require('./testrail-cache');

class TestRailApi {
  constructor(options) {
    this.options = options;
    this.base = `${this.options.host}/index.php?/api/v2`;
    this.runId;
    this.planId = this.options.planId
  }

  async createPlan(name, description, milestoneId) {
    var suiteIds = this.options.suiteIds;
    var entries = [];
    for (var i = 0; i < suiteIds.length; i++) {
      var entry = {
        suite_id: suiteIds[i],
        name: `${name} - Suite ${suiteIds[i]}`,
        include_all: true
      }
      entries.push(entry);
    }
    var data = {
      name: name,
      description: description,
      entries: entries
    };
    if (milestoneId) {
      data['milestone_id'] = milestoneId;
    }

    try {
      var plan = await this._post('add_plan', this.options.projectId.toString(), data);
      this.planId = plan.id;
    } catch (e) {
      console.error(e);
    };
  };

  async createPlanEntry(name, description, testcaseIds) {
    var data = {
      suite_id: this.options.suiteId,
      name: name,
      description: description,
      assignedto_id: this.options.assignedToId,
      case_ids: testcaseIds,
      include_all: false,
      runs: [{
        case_ids: testcaseIds,
        include_all: false
      }]
    };
    try {
      var planEntry = await this._post('add_plan_entry', this.planId.toString(), data);
      this.runId = planEntry.runs[0].id;
    } catch (e) {
      console.error(e);
    };
  };


  async createRun(name, description, testcaseIds) {
    try {
      var run = await this._post('add_run', this.options.projectId.toString(), {
        suite_id: this.options.suiteId,
        name: name,
        description: description,
        assignedto_id: this.options.assignedToId,
        include_all: false,
        case_ids: testcaseIds
      });
      this.runId = run.id;
    } catch (e) {
      console.error(e);
    }
  };

  async deleteReport() {
    try {
      if (this.options.usePlan === true) {
        await this._post('delete_plan', this.planId.toString());
      } else {
        await this._post('delete_run', this.runId.toString());
      }
    } catch (e) {
      console.error(e);
    };
  };

  async publishResults(results) {
    try {
      await this._post('add_results_for_cases', this.runId.toString(), {
        results: results
      });
    } catch (e) {
      console.error(e);
    };
  };


  /**
   * sends a GET request to TestRail's API with the passed in action and urlData
   * @param {String} action the URL path to be appended to the Base
   * @param {String} urlData the additional URL variables to be included
   */
  async _get(action, urlData) {
    return await this._makeRequest('GET', action, urlData);
  };

  /**
   * sends a POST request to TestRail's API with the passed in action and urlData and a request
   * body from the serialised data
   * @param {String} action the URL path to be appended to the Base
   * @param {String} urlData the additional URL variables to be included
   * @param {any} data a JavaScript object to be serialised out and sent with the request
   */
  async _post(action, urlData, data) {
    return await this._makeRequest('POST', action, urlData, data);
  };

  _getAuth() {
    return {
      username: this.options.username,
      password: this.options.password,
    };
  };

  _getHeaders() {
    return { 'Content-Type': 'application/json' };
  };

  async _makeRequest(method, action, urlData, data) {
    var config = { // AxiosRequestConfig
      method: method,
      url: `${this.base}/${action}/${urlData}`,
      headers: this._getHeaders(),
      auth: this._getAuth()
    };
    if (data) {
      config['data'] = JSON.stringify(data);
    }
    var responseObj;
    try {
      var resp = await axios(config);
      if (resp.data && resp.data.error) {
        if (new String(resp.data.error).includes('API Rate Limit Exceeded')) {
          // API RATE LIMIT REACHED: wait one minute and then retry request
          console.log('TestRail API Rate Limit reached: waiting one minute and then retrying request...')
          await new Promise((resolve, reject) => {
            setTimeout(resolve, 60000);
          });
          responseObj = await this._makeRequest(method, action, urlData, data);
        } else {
          throw new Error(resp.data.error);
        }
      } else {
        responseObj = resp.data;
      }
    } catch (e) {
      console.error(e);
    }
    return responseObj;
  };
}

module.exports = TestRailApi;
