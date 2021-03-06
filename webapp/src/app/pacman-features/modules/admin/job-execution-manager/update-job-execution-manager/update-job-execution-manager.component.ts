/*
 *Copyright 2018 T Mobile, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); You may not use
 * this file except in compliance with the License. A copy of the License is located at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * or in the "license" file accompanying this file. This file is distributed on
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or
 * implied. See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef } from "@angular/core";
import { environment } from "./../../../../../../environments/environment";

import { ActivatedRoute, Router } from "@angular/router";
import { Subscription } from "rxjs/Subscription";
import * as _ from "lodash";
import { UtilsService } from "../../../../../shared/services/utils.service";
import { LoggerService } from "../../../../../shared/services/logger.service";
import { NavigationStart } from "@angular/router";
import { Event, NavigationEnd } from "@angular/router";
import "rxjs/add/operator/filter";
import "rxjs/add/operator/pairwise";
import { RoutesRecognized } from "@angular/router";
import { RefactorFieldsService } from "./../../../../../shared/services/refactor-fields.service";
import { WorkflowService } from "../../../../../core/services/workflow.service";
import { RouterUtilityService } from "../../../../../shared/services/router-utility.service";
import { AdminService } from "../../../../services/all-admin.service";
import { NgForm } from "@angular/forms";
import { SelectComponent } from "ng2-select";
import { UploadFileService } from "../../../../services/upload-file-service";
import { ErrorHandlingService } from "../../../../../shared/services/error-handling.service";

@Component({
  selector: 'app-admin-update-job-execution-manager',
  templateUrl: './update-job-execution-manager.component.html',
  styleUrls: ['./update-job-execution-manager.component.css'],
  providers: [
    LoggerService,
    ErrorHandlingService,
    UploadFileService,
    AdminService
  ]
})
export class UpdateJobExecutionManagerComponent implements OnInit {
  @ViewChild('targetType') targetTypeSelectComponent: SelectComponent;
  @ViewChild('jobFrequencyMonthDay') jobFrequencyMonthDayComponent: SelectComponent;

  pageTitle: String = "Update Job Execution Manager";
  allJobNames: any = [];
  breadcrumbArray: any = ["Admin", "Job Execution Manager"];
  breadcrumbLinks: any = ["policies", "job-execution-manager"];
  breadcrumbPresent: any;
  outerArr: any = [];
  dataLoaded: boolean = false;
  errorMessage: any;
  showingArr: any = ["policyName", "policyId", "policyDesc"];
  allColumns: any = [];
  totalRows: number = 0;
  currentBucket: any = [];
  bucketNumber: number = 0;
  firstPaginator: number = 1;
  lastPaginator: number;
  currentPointer: number = 0;
  seekdata: boolean = false;
  showLoader: boolean = true;
  hideContent: boolean = false;
  allMonthDays: any = [];
  allEnvironments: any = [];
  allJobParams: any = [];

  paginatorSize: number = 25;
  isLastPage: boolean;
  isFirstPage: boolean;
  totalPages: number;
  pageNumber: number = 0;

  searchTxt: String = "";
  dataTableData: any = [];
  initVals: any = [];
  tableDataLoaded: boolean = false;
  filters: any = [];
  searchCriteria: any;
  filterText: any = {};
  errorValue: number = 0;
  showGenericMessage: boolean = false;
  dataTableDesc: String = "";
  urlID: String = "";

  FullQueryParams: any;
  queryParamsWithoutFilter: any;
  urlToRedirect: any = "";
  mandatory: any;
  parametersInput: any = { jobKey: '', jobValue: '', envKey: '', envValue: '' };
  allFrequencies: any = ["Daily", "Hourly", "Minutes", "Monthly", "Weekly", "Yearly"];
  allMonths: any = [
    { text: 'January', id: 0 },
    { text: 'February', id: 1 },
    { text: 'March', id: 2 },
    { text: 'April', id: 3 },
    { text: 'May', id: 4 },
    { text: 'June', id: 5 },
    { text: 'July', id: 6 },
    { text: 'August', id: 7 },
    { text: 'September', id: 8 },
    { text: 'October', id: 9 },
    { text: 'November', id: 10 },
    { text: 'December', id: 11 }
  ];
  isAlexaKeywordValid: any = -1;
  jobJarFile: any;
  currentFileUpload: File;
  selectedFiles: FileList;
  jobLoader: boolean = false;
  isJobSuccess: boolean = false;
  isJobFailed: boolean = false;

  jobType: any = "jar";
  selectedFrequency: any = "";
  jobJarFileName: any = "";

  public labels: any;
  private previousUrl: any = "";
  private pageLevel = 0;
  public backButtonRequired;
  private routeSubscription: Subscription;
  private getKeywords: Subscription;
  private previousUrlSubscription: Subscription;
  private downloadSubscription: Subscription;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private utils: UtilsService,
    private logger: LoggerService,
    private errorHandling: ErrorHandlingService,
    private uploadService: UploadFileService,
    private ref: ChangeDetectorRef,
    private refactorFieldsService: RefactorFieldsService,
    private workflowService: WorkflowService,
    private routerUtilityService: RouterUtilityService,
    private adminService: AdminService
  ) {

    this.routerParam();
    this.updateComponent();
  }

  ngOnInit() {
    this.urlToRedirect = this.router.routerState.snapshot.url;
    this.breadcrumbPresent = "Create Job Execution Manager";
    this.backButtonRequired = this.workflowService.checkIfFlowExistsCurrently(
      this.pageLevel
    );
  }

  nextPage() {
    try {
      if (!this.isLastPage) {
        this.pageNumber++;
        this.showLoader = true;
        //this.getPolicyDetails();
      }
    } catch (error) {
      this.errorMessage = this.errorHandling.handleJavascriptError(error);
      this.logger.log("error", error);
    }
  }

  prevPage() {
    try {
      if (!this.isFirstPage) {
        this.pageNumber--;
        this.showLoader = true;
        //this.getPolicyDetails();
      }

    } catch (error) {
      this.errorMessage = this.errorHandling.handleJavascriptError(error);
      this.logger.log("error", error);
    }
  }

  createNewJob(form: NgForm) {
    this.hideContent = true;
    this.jobLoader = true;
    let newRuleModel = this.buildCreateJobModel(form.value);
  }

  jobName: string;
  private buildCreateJobModel(jobForm) {
    let newJobModel = Object();
    this.jobName = jobForm.jobName;
    newJobModel.jobName = jobForm.jobName;
    newJobModel.jobDesc = jobForm.jobDesc;
    newJobModel.jobFrequency = this.buildRuleFrequencyCronJob(jobForm);
    newJobModel.jobType = jobForm.jobType;
    newJobModel.jobParams = this.buildJobParams();
    newJobModel.jobExecutable = this.jobJarFileName;
    newJobModel.isFileChanged = true;

    var url = environment.createJob.url;
    var method = environment.createJob.method;
    this.currentFileUpload = this.selectedFiles.item(0);
    this.uploadService.pushFileToStorage(url, method, this.currentFileUpload, newJobModel).subscribe(event => {
      this.jobLoader = false;
      this.isJobSuccess = true;
    },
    error => {
      this.isJobFailed = true;
      this.showGenericMessage = true;
      this.errorValue = -1;
      this.outerArr = [];
      this.dataLoaded = true;
      this.seekdata = true;
      this.errorMessage = "apiResponseError";
      this.showLoader = false;
      this.jobLoader = false;
    })
    //this.selectedFiles = undefined
  }

  private buildJobParams() {
    let jobParms = Object();
    jobParms.params = this.allJobParams;
    jobParms.environmentVariables = this.allEnvironments;
    return JSON.stringify(jobParms);
  }

  private getRuleRestUrl(jobForm) {
    let jobType = jobForm.jobType;
    if (jobType === 'Serverless') {
      return jobForm.jobRestUrl;
    } else {
      return '';
    }
  }

  private buildRuleFrequencyCronJob(jobForm) {
    let selectedFrequencyType = jobForm.jobFrequency[0].text;
    let cronDetails = Object();
    cronDetails.interval = selectedFrequencyType;
    if (selectedFrequencyType === 'Yearly') {
      cronDetails.day = jobForm.jobFrequencyMonth[0].id;
      cronDetails.month = (jobForm.jobFrequencyMonth[0].id + 1);
    } else if (selectedFrequencyType === 'Monthly') {
      cronDetails.duration = parseInt(jobForm.jobFrequencyMonths);
      cronDetails.day = parseInt(jobForm.jobFrequencyDays);
    } else if (selectedFrequencyType === 'Weekly') {
      cronDetails.week = jobForm.weekName;
    } else {
      cronDetails.duration = parseInt(jobForm.jobFrequencyModeValue);
    }

    return this.generateExpression(cronDetails);
  }

  private generateExpression(cronDetails) {

    let getCronExpression = function (cronObj) {
      if (cronObj === undefined || cronObj === null) {
        return undefined;
      } else {
        let cronObjFields = ['minutes', 'hours', 'dayOfMonth', 'month', 'dayOfWeek', 'year'];
        let cronExpression = cronObj.minutes;
        for (let index = 1; index < cronObjFields.length; index++) {
          cronExpression = cronExpression + ' ' + cronObj[cronObjFields[index]];
        }
        return cronExpression;
      }
    };

    let isValid = function (cronValidity) {
      if (cronValidity.minutes && cronValidity.hours && cronValidity.dayOfMonth && cronValidity.month && cronValidity.dayOfWeek && cronValidity.year) {
        return true;
      }
      return false;
    };

    let cronObj = {};
    if (cronDetails.interval == 'Minutes') {
      cronObj = {
        minutes: '0/' + cronDetails.duration,
        hours: '*',
        dayOfMonth: '*',
        month: '*',
        dayOfWeek: '?',
        year: '*'
      };
    } else if (cronDetails.interval == 'Hourly') {
      cronObj = {
        minutes: '0',
        hours: '0/' + cronDetails.duration,
        dayOfMonth: '*',
        month: '*',
        dayOfWeek: '?',
        year: '*'
      };
    } else if (cronDetails.interval == 'Daily') {
      cronObj = {
        minutes: '0',
        hours: '0',
        dayOfMonth: '1/' + cronDetails.duration,
        month: '*',
        dayOfWeek: '?',
        year: '*'
      };
    } else if (cronDetails.interval == 'Weekly') {
      cronObj = {
        minutes: '0',
        hours: '0',
        dayOfMonth: '?',
        month: '*',
        dayOfWeek: cronDetails.week,
        year: '*'
      };
    } else if (cronDetails.interval == 'Monthly') {
      cronObj = {
        minutes: '0',
        hours: '0',
        dayOfMonth: cronDetails.day,
        month: '1/' + cronDetails.duration,
        dayOfWeek: '?',
        year: '*'
      };
    } else if (cronDetails.interval == 'Yearly') {
      cronObj = {
        minutes: '0',
        hours: '0',
        dayOfMonth: cronDetails.day,
        month: cronDetails.month,
        dayOfWeek: '?',
        year: '*'
      };
    }
    return getCronExpression(cronObj);
  };

  onJarFileChange(event) {
    this.selectedFiles = event.target.files;
    this.jobJarFileName = this.selectedFiles[0].name;
    let extension = this.jobJarFileName.substring(this.jobJarFileName.lastIndexOf(".")+1);
    if(extension!=='jar') {
      this.removeJarFileName();
    }
  }

  removeJarFileName() {
    this.jobJarFileName = "";
    this.jobJarFile = "";
  }

  closeErrorMessage() {
    this.isJobFailed = false;
    this.hideContent = false;
  }

  openJarFileBrowser(event) {
    let element: HTMLElement = document.getElementById('selectJarFile') as HTMLElement;
    element.click();
  }

  addEnvironmentParameters(parametersInput: any, isEncrypted: any) {
    if (parametersInput.envKey !== '' && parametersInput.envValue !== '') {
      this.allEnvironments.push({ name: parametersInput.envKey, value: parametersInput.envValue });
      parametersInput.envKey = '';
      parametersInput.envValue = '';
      isEncrypted.checked = false;
    }
  }

  addJobParameters(parametersInput: any, isEncrypted: any) {
    if (parametersInput.jobKey !== '' && parametersInput.jobValue !== '') {
      this.allJobParams.push({ key: parametersInput.jobKey, value: parametersInput.jobValue, encrypt: false });
      parametersInput.jobKey = '';
      parametersInput.jobValue = '';
      isEncrypted.checked = false;
    }
  }

  isAlexaKeywordAvailable(alexaKeyword) {
    if (alexaKeyword.length == 0) {
      this.isAlexaKeywordValid = -1;
    } else {
      if (alexaKeyword === 'manu') {
        this.isAlexaKeywordValid = 0;

      } else {
        this.isAlexaKeywordValid = 1;
      }
    }
  }

  onSelectFrequency(frequencyType) {
    this.selectedFrequency = frequencyType.text;
  }

  onSelectFrequencyMonth(selectedMonth) {
    this.jobFrequencyMonthDayComponent.placeholder = 'Select Day';
    if (this.jobFrequencyMonthDayComponent.active) {
      this.jobFrequencyMonthDayComponent.active.length = 0;
    }
    let monthDays: any = [];
    let daysCount = this.getNumberOfDays(selectedMonth.id);
    for (let dayNo = 1; dayNo <= daysCount; dayNo++) {
      monthDays.push({ id: dayNo, text: dayNo.toString() });
    }
    this.allMonthDays = monthDays;
    this.jobFrequencyMonthDayComponent.items = monthDays;
  }


  private getNumberOfDays = function (month) {
    var year = new Date().getFullYear();
    var isLeap = ((year % 4) == 0 && ((year % 100) != 0 || (year % 400) == 0));
    return [31, (isLeap ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
  }

  /*
    * This function gets the urlparameter and queryObj 
    *based on that different apis are being hit with different queryparams
    */
  routerParam() {
    try {
      // this.filterText saves the queryparam
      let currentQueryParams = this.routerUtilityService.getQueryParametersFromSnapshot(this.router.routerState.snapshot.root);
      if (currentQueryParams) {

        this.FullQueryParams = currentQueryParams;

        this.queryParamsWithoutFilter = JSON.parse(JSON.stringify(this.FullQueryParams));
        delete this.queryParamsWithoutFilter['filter'];

        /**
         * The below code is added to get URLparameter and queryparameter
         * when the page loads ,only then this function runs and hits the api with the
         * filterText obj processed through processFilterObj function
         */
        this.filterText = this.utils.processFilterObj(
          this.FullQueryParams
        );

        this.urlID = this.FullQueryParams.TypeAsset;
        //check for mandatory filters.
        if (this.FullQueryParams.mandatory) {
          this.mandatory = this.FullQueryParams.mandatory;
        }

      }
    } catch (error) {
      this.errorMessage = this.errorHandling.handleJavascriptError(error);
      this.logger.log("error", error);
    }
  }

  /**
   * This function get calls the keyword service before initializing
   * the filter array ,so that filter keynames are changed
   */

  updateComponent() {
    this.outerArr = [];
    this.searchTxt = "";
    this.currentBucket = [];
    this.bucketNumber = 0;
    this.firstPaginator = 1;
    this.showLoader = true;
    this.currentPointer = 0;
    this.dataTableData = [];
    this.tableDataLoaded = false;
    this.dataLoaded = false;
    this.seekdata = false;
    this.errorValue = 0;
    this.showGenericMessage = false;
    // this.getData();
  }

  navigateBack() {
    try {
      this.workflowService.goBackToLastOpenedPageAndUpdateLevel(this.router.routerState.snapshot.root);
    } catch (error) {
      this.logger.log("error", error);
    }
  }

  goToCreatePolicy() {
    try {
      this.workflowService.addRouterSnapshotToLevel(this.router.routerState.snapshot.root);
      this.router.navigate(["../create-edit-policy"], {
        relativeTo: this.activatedRoute,
        queryParamsHandling: 'merge',
        queryParams: {
        }
      });
    } catch (error) {
      this.errorMessage = this.errorHandling.handleJavascriptError(error);
      this.logger.log("error", error);
    }
  }

  ngOnDestroy() {
    try {
      if (this.routeSubscription) {
        this.routeSubscription.unsubscribe();
      }
      if (this.previousUrlSubscription) {
        this.previousUrlSubscription.unsubscribe();
      }
    } catch (error) {
      this.logger.log("error", "--- Error while unsubscribing ---");
    }
  }
}
