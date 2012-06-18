﻿"use strict";

/**
 * @constructor
 * @extends ViewBase
 */
var ProfilerView = function(id, name, container_class, html, default_handler)
{
  var SUCCESS = 0;

  var event_type = ProfilerService.EventType;
  var TYPE_GENERIC = event_type.GENERIC;
  var TYPE_PROCESS = event_type.PROCESS;
  var TYPE_DOCUMENT_PARSING = event_type.DOCUMENT_PARSING;
  var TYPE_CSS_PARSING = event_type.CSS_PARSING;
  var TYPE_SCRIPT_COMPILATION = event_type.SCRIPT_COMPILATION;
  var TYPE_THREAD_EVALUATION = event_type.THREAD_EVALUATION;
  var TYPE_REFLOW = event_type.REFLOW;
  var TYPE_STYLE_RECALCULATION = event_type.STYLE_RECALCULATION;
  var TYPE_CSS_SELECTOR_MATCHING = event_type.CSS_SELECTOR_MATCHING;
  var TYPE_LAYOUT = event_type.LAYOUT;
  var TYPE_PAINT = event_type.PAINT;

  var mode = ProfilerService.Mode;
  var MODE_ALL = mode.ALL;
  var MODE_REDUCE_UNIQUE_TYPES = mode.REDUCE_UNIQUE_TYPES;
  var MODE_REDUCE_UNIQUE_EVENTS = mode.REDUCE_UNIQUE_EVENTS;
  var MODE_REDUCE_ALL = mode.REDUCE_ALL;

  var SESSION_ID = 0;
  var TIMELINE_LIST = 2;
  var TIMELINE_ID = 0;

  var AGGREGATED_EVENTS_WIDTH = parseInt(document.styleSheets.getDeclaration(".profiler-timeline").left) || 0;

  // Parent-children relationships
  this._children = {};
  this._children[TYPE_STYLE_RECALCULATION] = TYPE_CSS_SELECTOR_MATCHING;

  this._default_types = [
    //TYPE_GENERIC,
    //TYPE_PROCESS,
    TYPE_DOCUMENT_PARSING,
    TYPE_CSS_PARSING,
    TYPE_SCRIPT_COMPILATION,
    TYPE_THREAD_EVALUATION,
    TYPE_REFLOW,
    TYPE_STYLE_RECALCULATION,
    //TYPE_STYLE_SELECTOR_MATCHING,
    TYPE_LAYOUT,
    TYPE_PAINT
  ];

  this._timeline_modes = [
    {id: "_timeline_list", mode: MODE_ALL},
    {id: "_aggregated_list", mode: MODE_REDUCE_UNIQUE_TYPES},
    {id: "_reduced_list", mode: MODE_REDUCE_ALL}
  ];

  this._reset = function()
  {
    this._table = null;
    this._current_session_id = null;
    this._current_timeline_id = null;
    this._event_id = null;
    this._event_type = null;
    this._timeline_list = null;
    this._aggregated_list = null;
    this._reduced_list = null;
    this._details_time = 0;
  };

  this._reset_details = function()
  {
    this._table = null;
    this._details_time = 0;
  };

  this._start_profiler = function()
  {
    this._reset();
    this._container.clearAndRender(this._templates.empty(ui_strings.S_PROFILER_PROFILING));
    this._profiler.start_profiler(this._handle_start_profiler.bind(this));
    this._overlay.set_window_id(this._profiler.get_window_id());
  };

  this._handle_start_profiler = function(status, msg)
  {
    if (status === SUCCESS)
    {
      this._old_session_id = this._current_session_id;
      this._current_session_id = msg[SESSION_ID];
    }
    else
    {
      this._show_error_message(msg);
    }
    this._update_record_button_title();
  };

  this._stop_profiler = function()
  {
    this._container.clearAndRender(this._templates.empty(ui_strings.S_PROFILER_CALCULATING));
    var config = {session_id: this._current_session_id};
    this._profiler.stop_profiler(this._handle_stop_profiler.bind(this), config);
  };

  this._handle_stop_profiler = function(status, msg)
  {
    if (status === SUCCESS)
    {
      this._current_timeline_id = msg[TIMELINE_LIST][0][TIMELINE_ID];
      this._timeline_modes.forEach(function(timeline_mode) {
        var config = {
          session_id: this._current_session_id,
          timeline_id: this._current_timeline_id,
          mode: timeline_mode.mode,
          event_type_list: this._default_types,
        };
        this._profiler.get_events(this._handle_timeline_list.bind(this, timeline_mode.id), config);
      }, this);
    }
    else
    {
      this._show_error_message(msg);
    }
    this._update_record_button_title();
  };

  this._handle_timeline_list = function(id, status, msg)
  {
    if (status === SUCCESS)
    {
      this[id] = new cls.Profiler["1.0"].EventList(msg);
      if (this._timeline_list && this._aggregated_list && this._reduced_list)
        this._update_view();
    }
    else
    {
      this._show_error_message(msg);
    }
  };

  this._show_error_message = function(msg)
  {
    this._container.clearAndRender(this._templates.empty(ui_strings.S_PROFILER_PROFILING_FAILED));
    opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE + ": \n" + msg)
  };

  this._update_view = function()
  {
    if (!this._container)
      return;
    var zero_point = this._get_zero_point();
    var has_details_events = this._table && this._table.get_data().length > 0;
    var template = null;
    if (this._timeline_list && this._timeline_list.eventList)
    {
      var width = this._container.clientWidth - AGGREGATED_EVENTS_WIDTH;
      template = this._timeline_list.eventList[0]
               ? this._templates.main(has_details_events,
                                      this._templates.legend(this._aggregated_list),
                                      this._templates.event_list_all(this._timeline_list,
                                                                     this._event_id,
                                                                     width,
                                                                     zero_point),
                                      this._templates.details(this._table),
                                      this._templates.status(this._details_time))
               : this._templates.empty(ui_strings.S_PROFILER_NO_DATA);
    }
    else
    {
      template = this._templates.empty(ui_strings.S_PROFILER_START_MESSAGE);
    }
    this._container.clearAndRender(template);
    this._details_list = this._container.querySelector(".profiler-details-list");
    this._status = this._container.querySelector(".profiler-status");
  };

  this.createView = function(container)
  {
    this._container = container;
    this._update_view();
  };

  this.create_disabled_view = function(container)
  {
    container.clearAndRender(this._templates.disabled_view());
  };

  this.ondestroy = function() {};

  this.focus = function() {};

  this.blur = function() {};

  this.onclick = function() {};

  this.onresize = function()
  {
    if (this._container)
      this._update_view();
  };

  /**
   * Starts the profiler if it's active, or stops it otherwise.
   */
  this._start_stop_profiler = function()
  {
    if (this._profiler.is_active)
      this._stop_profiler();
    else
      this._start_profiler();
  };

  this._get_event_details = function(event, target)
  {
    this._event_id = Number(target.getAttribute("data-event-id")) || null;
    this._event_type = Number(target.getAttribute("data-event-type"));
    this._show_details_list();
  };

  this._show_details_list = function()
  {
    var child_type = this._children[this._event_type];
    if (child_type)
    {
      this._details_list.clearAndRender(this._templates.empty(ui_strings.S_PROFILER_CALCULATING));
      var config = {
        session_id: this._current_session_id,
        timeline_id: this._current_timeline_id,
        mode: MODE_REDUCE_UNIQUE_EVENTS,
        event_id: this._event_id,
        event_type_list: [child_type]
      };
      this._profiler.get_events(this._handle_details_list.bind(this, child_type), config);
    }
    else
    {
      this._reset_details();
      this._details_list.clearAndRender(this._templates.no_events());
      this._details_list.addClass("profiler-no-status");
      this._status.addClass("profiler-no-status");
    }
  };

  this._handle_details_list = function(child_type, status, msg)
  {
    var sortby = this._table ? this._table.sortby : "time";
    var reversed = this._table ? this._table.reversed : true;
    var table_def = this._templates._tabledefs[child_type];
    this._table = new SortableTable(table_def,
                                    null,
                                    table_def.column_order,
                                    sortby,
                                    null,
                                    reversed);
    var data = this._get_top_list_data(new cls.Profiler["1.0"].EventList(msg));
    if (data.length)
    {
      this._table.set_data(data);
      this._details_time = data.reduce(function(prev, curr) {
        return prev + curr.time;
      }, 0);
      this._details_list.clearAndRender(this._templates.details(this._table));
      this._status.clearAndRender(this._templates.status(this._details_time));
      this._details_list.removeClass("profiler-no-status");
      this._status.removeClass("profiler-no-status");
    }
    else
    {
      this._details_list.clearAndRender(this._templates.no_events());
    }
  };

  this._get_top_list_data = function(events)
  {
    var type = events.eventList && events.eventList[0] && events.eventList[0].type;
    switch (type)
    {
    case TYPE_CSS_SELECTOR_MATCHING:
      return events.eventList.map(function(event) {
        return {
          selector: event.cssSelectorMatching.selector,
          time: event.time,
          hits: event.hits
        };
      });
    }
    return [];
  };

  // TODO: this should not be in the view
  /**
   * Get an event based on its ID. If no event has the ID, returns null.
   *
   * @param {Number} id The id of the event to return
   * @return {Event|null} An event in case one was found with ID `id`,
   *         otherwise `null`.
   */
  this._get_event_by_id = function(id)
  {
    var timeline_list = this._timeline_list;
    var events = timeline_list && timeline_list.eventList;
    if (events)
    {
      for (var i = 0, event; event = events[i]; i++)
      {
        if (event.eventID === id)
          return event;
      }
    }
    return null;
  };

  this._reload_window = function(event, target)
  {
    if (this._current_session_id)
      this._profiler.release_session(null, {session_id: this._old_session_id});
    this._reset();
    window.services.scope.enable_profile(window.app.profiles.PROFILER);
  };

  this._update_record_button_title = function()
  {
    window.toolbars[this.id].set_button_title("profiler-start-stop", this._profiler.is_active ?
                                                                     ui_strings.S_BUTTON_STOP_PROFILER :
                                                                     ui_strings.S_BUTTON_START_PROFILER);
  };

  this._get_zero_point = function()
  {
    return this._has_zero_at_first_event
         ? (this._timeline_list &&
            this._timeline_list.eventList &&
            this._timeline_list.eventList[0] &&
            this._timeline_list.eventList[0].interval.start)
         : 0;
  };

  this._on_profile_enabled = function(msg)
  {
    if (msg.profile === window.app.profiles.PROFILER)
    {
      this._has_overlay_service = window.services["overlay"] && window.services["overlay"].is_enabled;
      window.runtimes.reloadWindow();
    }
  };

  this._on_settings_changed = function(msg)
  {
    if (msg.id === this.id && msg.key === "zero-at-first-event")
      this._has_zero_at_first_event = msg.value;
  };

  this._on_settings_initialized = function(msg)
  {
    if (msg.view_id === this.id)
      this._has_zero_at_first_event = msg.settings["zero-at-first-event"];
  };

  this._ontooltip = function(event, target)
  {
    var id = Number(target.get_attr("parent-node-chain", "data-event-id"));
    var timeline_event = this._get_event_by_id(id);
    if (timeline_event)
    {
      this._tooltip.show(this._templates.get_title_all(timeline_event));
    }
  };

  this._show_event_details = function(event, target)
  {
    if (!this._has_overlay_service)
      return;
    var id = Number(target.get_attr("parent-node-chain", "data-event-id"));
    var timeline_event = this._get_event_by_id(id);
    if (timeline_event)
    {
      if (timeline_event.type === TYPE_PAINT)
      {
        var area = timeline_event.paint.area;
        var config = {x: area.x, y: area.y, w: area.w, h:area.h};
        this._overlay.create_overlay(null, config);
      }
    }
  };

  this._hide_event_details = function(event, target)
  {
    if (!this._has_overlay_service)
      return;
    this._overlay.remove_overlay();
  };

  this._init = function(id, name, container_class, html, default_handler)
  {
    View.prototype.init.call(this, id, name, container_class, html, default_handler);
    this.required_services = ["profiler"];
    this._profiler = new ProfilerService();
    this._overlay = new OverlayService();
    this._templates = new ProfilerTemplates();
    this._has_overlay_service = false;
    this._has_zero_at_first_event = false;
    this._old_session_id = null;
    this._reset();

    this._tooltip = Tooltips.register("profiler-event", true, false);
    this._tooltip.ontooltip = this._ontooltip.bind(this);

    this._on_profile_enabled_bound = this._on_profile_enabled.bind(this);
    this._on_settings_changed_bound = this._on_settings_changed.bind(this);
    this._on_settings_initialized_bound = this._on_settings_initialized.bind(this);
    window.messages.addListener("profile-enabled", this._on_profile_enabled_bound);
    window.messages.addListener("setting-changed", this._on_settings_changed_bound);
    window.messages.addListener("settings-initialized", this._on_settings_initialized_bound);

    window.event_handlers.click["profiler-start-stop"] = this._start_stop_profiler.bind(this);
    window.event_handlers.click["profiler-reload-window"] = this._reload_window.bind(this);
    window.event_handlers.mousedown["profiler-event"] = this._get_event_details.bind(this);
    window.event_handlers.mouseover["profiler-event"] = this._show_event_details.bind(this);
    window.event_handlers.mouseout["profiler-event"] = this._hide_event_details.bind(this);
  };

  this._init(id, name, container_class, html, default_handler);
};

ProfilerView.prototype = ViewBase;

ProfilerView.create_ui_widgets = function()
{
  new ToolbarConfig(
    "profiler_all",
    [
      {
        handler: "profiler-start-stop",
        title: ui_strings.S_BUTTON_START_PROFILER
      }
    ]
  );

  new Settings(
    "profiler_all",
    {
      "zero-at-first-event": true
    },
    {
      "zero-at-first-event": ui_strings.S_SWITCH_CHANGE_START_TO_FIRST_EVENT
    }
  );

  new Switches(
    "profiler_all",
    [
      "zero-at-first-event"
    ]
  );
};

