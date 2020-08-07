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

  $projectSelect.chosen({
    inherit_select_classes: true,
    include_group_label_in_selected: true
  });

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

      $.each(responseText, function(issueKey, entries) {
        const filterFrom = Date.parse($form.find('[name=from]').val() + ' 00:00:00+00');
        const filterTo = Date.parse($form.find('[name=to]').val() + ' 23:59:59+00');
        let existingWorkLogs = {};

        AP.require('request', function(request) {
          request({
            url: '/rest/api/latest/issue/' + issueKey  + '/worklog',
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
                        console.log(response);
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
                        console.log(response);
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
