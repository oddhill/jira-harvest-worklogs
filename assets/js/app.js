/*
 * Welcome to your app's main JavaScript file!
 *
 * We recommend including the built version of this JavaScript file
 * (and its CSS file) in your base layout (base.html.twig).
 */

// any CSS you require will output into a single css file (app.css in this case)
require('../scss/app.scss');

// Need jQuery? Install it with "yarn add jquery", then uncomment to require it.
const $ = require('jquery');
require('bootstrap');
require('jquery-form');
require('chosen-js');

$(document).ready(function() {

  const $form = $('#import-timesheets');
  const $submitButton = $form.find('#submit');
  const loadingText = $submitButton.data('loading-text');
  const waitingText = $submitButton.data('waiting-text');
  const $projectSelect = $form.find('#project');
  let baseUrl = '';

  AP.getLocation(function(location){
    const pathArray = location.split( '/' );
    console.log(pathArray);
    baseUrl = pathArray[0] + '//' + pathArray[2];
  });

  $projectSelect.chosen({
    inherit_select_classes: true,
    include_group_label_in_selected: true
  });

  const updateResults = function(result) {
    let html = '';

    if ($.isEmptyObject(result)) {
      html = '<h2>No issues were affected</h2>';
    }
    else {
      html = '<h2>The following issues were affected</h2>';
      html += '<ul>';
      $.each(result, function(issueKey, seconds) {
        if (seconds != 0) {
          const hours = Math.abs(seconds / 3600);

          html += '<li>';
          html += '<a href="' + baseUrl + '/browse/' + issueKey + '">' + issueKey + '</a>: ';
          if (seconds > 0) {
            html += 'Added ' + hours + ' hours';
          } else {
            html += 'Removed ' + hours + ' hours';
          }
          html += '</li>';
        }
      });
      html += '</ul>';
    }

    $('#results').html(html);
  };

  $.ajax({
    url: '/projects',
    success: function(response) {
      $projectSelect.append('<option></option>');

      $.each(response, function(clientName, projects) {
        const $optgroup = $('<optgroup label="' + clientName + '">');

        $.each(projects, function(index, project) {
          $optgroup.append('<option value="' + project.id + '">' + project.name + '</option>');
        })

        $projectSelect.append($optgroup);
      })

      $projectSelect.attr('data-placeholder', 'Select a project').prop('disabled', false).trigger('chosen:updated');
    }
  });

  $form.ajaxForm({
    beforeSubmit: function(arr, $form, options) {
      $submitButton.html(loadingText).prop('disabled', true);
    },
    success: function(responseText, statusText) {
      $submitButton.html(waitingText).prop('disabled', false);
      const affectedIssues = {};
      updateResults(affectedIssues);

      $.each(responseText, function(issueKey, entries) {
        const filterFrom = Date.parse($form.find('[name=from]').val() + ' 00:00:00+00');
        const filterTo = Date.parse($form.find('[name=to]').val() + ' 23:59:59+00');
        let existingWorkLogs = {};
        if (!affectedIssues.hasOwnProperty(issueKey)) {
          affectedIssues[issueKey] = 0;
        }

        AP.require('request', function(request) {
          request({
            url: '/rest/api/3/issue/' + issueKey  + '/worklog',
            type: 'GET',
            contentType: 'application/json',
            success: function(response) {
              response = JSON.parse(response);

              $.each(response.worklogs, function(index, worklog) {
                const entryDate = Date.parse(worklog.started.substring(0, worklog.started.indexOf('T')));

                if (entryDate >= filterFrom && entryDate <= filterTo) {
                  const harvestID = worklog.comment.content[1].content[2].text.replace('Harvest ID: ', '');
                  existingWorkLogs[harvestID] = worklog;
                }
              });

              $.each(entries, function(index, entry) {
                const data = {
                  started: entry.date,
                  timeSpentSeconds: entry.seconds,
                  comment: entry.notes + "\n\nUser: " + entry.user + "\nHarvest ID: " + entry.id
                };

                if (!existingWorkLogs.hasOwnProperty(entry.id)) {
                  AP.require('request', function (request) {
                    request({
                      url: '/rest/api/latest/issue/' + issueKey + '/worklog',
                      type: 'POST',
                      data: JSON.stringify(data),
                      contentType: 'application/json',
                      success: function (response) {
                        response = JSON.parse(response);
                        existingWorkLogs[entry.id] = response;
                        affectedIssues[issueKey] += response.timeSpentSeconds;
                        updateResults(affectedIssues);
                      },
                      error: function () {
                        console.log(arguments);
                      }
                    });
                  });
                }
                else {
                  AP.require('request', function (request) {
                    request({
                      url: '/rest/api/latest/issue/' + issueKey + '/worklog/' + existingWorkLogs[entry.id].id,
                      type: 'PUT',
                      data: JSON.stringify(data),
                      contentType: 'application/json',
                      success: function (response) {
                        let diff = JSON.parse(response).timeSpentSeconds - existingWorkLogs[entry.id].timeSpentSeconds;
                        if (diff != 0) {
                          affectedIssues[issueKey] += diff;
                          updateResults(affectedIssues);
                        }
                      },
                      error: function () {
                        console.log(arguments);
                      }
                    });
                  });
                }
              });

              $.each(existingWorkLogs, function(harvestID, worklog) {
                  let exists = false;

                  $.each(entries, function(index, entry) {
                    if (entry.id == harvestID) {
                      exists = true;
                      return false;
                    }
                  });

                  if (!exists) {
                    AP.require('request', function (request) {
                      request({
                        url: '/rest/api/latest/issue/' + issueKey + '/worklog/' + worklog.id,
                        type: 'DELETE',
                        success: function (response) {
                          affectedIssues[issueKey] -= worklog.timeSpentSeconds;
                          updateResults(affectedIssues);
                        },
                        error: function () {
                          console.log(arguments);
                        }
                      });
                    });
                  }
              });
            },
            error: function() {
              console.log(arguments);
            }
          });
        });
      });
    },
    error: function() {
      alert('An error occured.');
      $submitButton.html(waitingText).prop('disabled', false);
    }
  });

});
