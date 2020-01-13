# TestRail Reporter for Cypress

Publishes [Cypress](https://www.cypress.io/) runs on TestRail.

## Install

```shell
$ npm install @bicarbon8/cypress-testrail-reporter --save-dev
```

## Usage

Add reporter to your `cypress.json`:

Ex: using a TestRail Plan containing multiple Suites

```json
...
"reporter": "cypress-testrail-reporter",
"reporterOptions": {
  "domain": "yourdomain.testrail.com",
  "username": "username",
  "password": "password",
  "usePlan": true,
  "projectId": 1,
  "suiteIds": [1, 2, 3],
}
```

Ex: using a TestRail Run containing only one Suite

```json
...
"reporter": "cypress-testrail-reporter",
"reporterOptions": {
  "domain": "yourdomain.testrail.com",
  "username": "username",
  "password": "password",
  "projectId": 1,
  "suiteId": 1,
}
```

Your Cypress tests should include the ID of your TestRail test case. Make sure your test case IDs are distinct from your test titles:

```Javascript
// Good:
it("C123 C124 Can authenticate a valid user", ...
it("Can authenticate a valid user C321", ...

// Bad:
it("C123Can authenticate a valid user", ...
it("Can authenticate a valid userC123", ...
```

## Reporter Options

**domain**: _string_ domain name of your TestRail instance (e.g. for a hosted instance _instance.testrail.com_).

**username**: _string_ email of the user under which the test run will be created.

**password**: _string_ password or the API key for the aforementioned user.

**projectId**: _number_ project with which the tests are associated.

**usePlan**: _boolean_ if true a TestRail Plan containing one or more runs will be created based on the values specified for **suiteIds**.

**suiteIds**: _number[]_ (required only when **usePlan** is true) the suites with which the tests are associated.

**suiteId**: _number_ (required when **usePlan** is false or not included) suite with which the tests are associated.

**runName**: _string_ (optional) name of the Testrail run.

## TestRail Settings

To increase security, the TestRail team suggests using an API key instead of a password. You can see how to generate an API key [here](http://docs.gurock.com/testrail-api2/accessing#username_and_api_key).

If you maintain your own TestRail instance on your own server, it is recommended to [enable HTTPS for your TestRail installation](http://docs.gurock.com/testrail-admin/admin-securing#using_https).

For TestRail hosted accounts maintained by [Gurock](http://www.gurock.com/), all accounts will automatically use HTTPS.

You can read the whole TestRail documentation [here](http://docs.gurock.com/).

## Authors

* Jason Holt Smith - [github](https://github.com/bicarbon8)

## License

This project is licensed under the [MIT license](/LICENSE.md).

## Acknowledgments

* [Milutin Savovic](https://github.com/mickosav), owner of the [cypress-testrail-reporter](https://github.com/mickosav/cypress-testrail-reporter) repository that was forked.
