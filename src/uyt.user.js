// ==UserScript==
// @name        Usable YouTube
// @description Makes YouTube more usable
// @version     1.1
// @namespace   nutbread
// @include     http://youtube.com/*
// @include     https://youtube.com/*
// @include     http://*.youtube.com/*
// @include     https://*.youtube.com/*
// @grant       none
// @run-at      document-start
// @icon        data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAB+UlEQVR42u3XvWtTURgG8Hdqb3LzeWv9ABFUjCj+CU79BwQplA4uUjpYQQcdOhYcjSJasVpKC0UDhYigpKCxlNTWkA52SJWADYHbijdDMiTChcLjc+ES6mcPTehZOvyeA+fA877rEQBaHSwgBcvUSv8CeYbvOmVp1VchdEhlR2+aLpJ45COD0oR9liKRZcvsJ2jSL7m4mSJokpLFeDBP0CQv7+NBm6Bq8fhh7+wUW97Gg9sEFdljPfixtYnGxlcUb4wgeyTm3bdjW+ZjQajKXkjAdd2WxrctrI/exrsTR733PZE3DGXnE2g0Gr9oNpuob9pYu3UTmd6YepdPXjGUnTuDWq32V/V6Hd8/r2PlyqB6H0maoYwLOI7zX9VqFV+ez+JlT1ipU+aiASg7exq2be8qNz2FOSuk1CkphjIuUC6X/+nT8gckL1/CqNmFF4qdMstQljiFUqn0h7VCAeNDVzESNZEMG+p9JDMMZYmTKBaLLYWlJTzi4Gu9Fu6EujGt3tUiU5GAS1AxcSiGlYUF5OYzuDs4gOGIiTGzG0+9971x5VkkUCGomKBhK4qhQBfGQgYH8749G/IkEsgRVI17Z+fk5HHEmCRoMikPw0YfQZM+eRA2PEnCPkuSyH2Gb4Be0+oODqFNzm+dGX+WeOQeQx/9Cxz8DfUv8BPC7tqgW88FVAAAAABJRU5ErkJggg==
// @updateURL   https://raw.githubusercontent.com/nutbread/uyt/master/builds/uyt.meta.js
// @downloadURL https://raw.githubusercontent.com/nutbread/uyt/master/src/uyt.user.js
// ==/UserScript==
// ==ChromeExtension==
// @permission   http://youtube.com/
// @permission   https://youtube.com/
// @permission   http://*.youtube.com/
// @permission   https://*.youtube.com/
// @icon-size    16:bilinear
// @icon-size    32:bilinear
// @icon-size    48:bilinear
// @icon-size    64:bilinear
// @icon-size    128:bilinear
// @update-url   https://raw.githubusercontent.com/nutbread/uyt/master/builds/uyt.update.xml
// @download-url https://raw.githubusercontent.com/nutbread/uyt/master/builds/uyt.crx
// ==/ChromeExtension==



// Main
(function () {
	"use strict";

	// Module for performing actions as soon as possible
	var ASAP = (function () {

		// Variables
		var state = 0;
		var callbacks_asap = [];
		var callbacks_ready = [];
		var callbacks_check = [];
		var callback_check_interval = null;
		var callback_check_interval_time = 20;
		var on_document_readystatechange_interval = null;



		// Events
		var on_document_readystatechange = function () {
			// State check
			if (document.readyState == "interactive") {
				if (state == 0) {
					// Mostly loaded
					state = 1;

					// Callbacks
					var c = callbacks_asap;
					callbacks_asap = null;
					trigger_callbacks(c);
				}
			}
			else if (document.readyState == "complete") {
				// Loaded
				state = 2;

				// Callbacks
				var c;
				if (callbacks_asap !== null) {
					c = callbacks_asap;
					callbacks_asap = null;
					trigger_callbacks(c);
				}

				c = callbacks_ready;
				callbacks_ready = null;
				trigger_callbacks(c);

				// Complete
				clear_events();
			}
		};
		var on_callbacks_check = function () {
			// Test all
			for (var i = 0; i < callbacks_check.length; ++i) {
				if (callback_test.call(null, callbacks_check[i])) {
					// Remove
					callbacks_check.splice(i, 1);
					--i;
				}
			}

			// Stop timer?
			if (callbacks_check.length == 0) {
				clearInterval(callback_check_interval);
				callback_check_interval = null;
			}
		};
		var on_callback_timeout = function (data) {
			// Remove
			for (var i = 0; i < callbacks_check.length; ++i) {
				if (callbacks_check[i] === data) {
					// Update
					data.timeout_timer = null;

					// Callback
					if (data.timeout_callback) data.timeout_callback.call(null);

					// Remove
					callbacks_check.splice(i, 1);
					return;
				}
			}
		};

		// Clear events
		var clear_events = function () {
			if (on_document_readystatechange_interval !== null) {
				// Remove timer
				clearInterval(on_document_readystatechange_interval);
				on_document_readystatechange_interval = null;

				// Remove events
				document.removeEventListener("readystatechange", on_document_readystatechange, false);

				// Clear callbacks
				callbacks_asap = null;
				callbacks_ready = null;
			}
		};

		// Test callback
		var callback_test = function (data) {
			if (!data.condition || data.condition.call(null)) {
				// Call
				data.callback.call(null);

				// Stop timeout
				if (data.timeout_timer !== null) {
					clearTimeout(data.timeout_timer);
					data.timeout_timer = null;
				}

				// Okay
				return true;
			}

			// Not called
			return false;
		};
		var callback_wait = function (data) {
			// Add to list
			callbacks_check.push(data);
			if (callback_check_interval === null) {
				callback_check_interval = setInterval(on_callbacks_check, callback_check_interval_time);
			}

			// Timeout
			if (data.timeout > 0) {
				data.timeout_timer = setTimeout(on_callback_timeout.bind(null, data), data.timeout * 1000);
			}
		};

		// Trigger callback list
		var trigger_callbacks = function (callback_list) {
			for (var i = 0, j = callback_list.length; i < j; ++i) {
				// Test
				if (!callback_test.call(null, callback_list[i])) {
					// Queue
					callback_wait.call(null, callback_list[i]);
				}
			}
		};

		// Add callback
		var add_callback = function (callback, condition, timeout, timeout_callback, target) {
			var cb_data = {
				callback: callback,
				condition: condition || null,
				timeout: timeout || 0,
				timeout_callback: timeout_callback || null,
				timeout_timer: null
			};

			if (target === null) {
				// Test
				if (!callback_test.call(null, cb_data)) {
					// Queue
					callback_wait.call(null, cb_data);
				}
			}
			else {
				// Add
				target.push(cb_data);
			}
		};

		// Setup events
		on_document_readystatechange();
		if (state < 2) {
			document.addEventListener("readystatechange", on_document_readystatechange, false);
			on_document_readystatechange_interval = setInterval(on_document_readystatechange, 20);
		}



		// Return functions
		return {

			/**
				Call a function as soon as possible when the DOM is fully loaded
				(document.readyState == "interactive")

				@param callback
					The callback to be called
					The call format is:
						callback.call(null)
				@param condition
					An additional condition to test for.
					If this condition is falsy, a timeout interval is
					used to continuously test it until it is true (or timed out)
					The call format is:
						condition.call(null)
				@param timeout
					If specified, a maximum time limit is given for the condition to be met
					Must be greater than 0, units are seconds
				@param timeout_callback
					If specified, this is a callback which is called when the condition check
					has timed out
					The call format is:
						timeout_callback.call(null)
			*/
			asap: function (callback, condition, timeout, timeout_callback) {
				// Add to asap
				add_callback.call(null, callback, condition, timeout, timeout_callback, callbacks_asap);
			},
			/**
				Call a function as soon as possible when the DOM is fully loaded
				(document.readyState == "complete")

				@param callback
					The callback to be called
					The call format is:
						callback.call(null)
				@param condition
					An additional condition to test for.
					If this condition is falsy, a timeout interval is
					used to continuously test it until it is true (or timed out)
					The call format is:
						condition.call(null)
				@param timeout
					If specified, a maximum time limit is given for the condition to be met
					Must be greater than 0, units are seconds
				@param timeout_callback
					If specified, this is a callback which is called when the condition check
					has timed out
					The call format is:
						timeout_callback.call(null)
			*/
			ready: function (callback, condition, timeout, timeout_callback) {
				// Add to ready
				add_callback.call(null, callback, condition, timeout, timeout_callback, callbacks_ready);
			},

		};

	})();



	// XHR communication for chrome
	var XHR = (function () {

		var generate_random_str = function (length) {
			var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-",
				str = "",
				i;

			for (i = 0; i < length; ++i) {
				str += chars[Math.floor(Math.random() * chars.length)];
			}

			return str;
		};

		var inject = function (nonce, origin, can_request, can_perform, entries) {
			var source = [ "(" ],
				i, scr;

			// Script source
			source.push(script.toString());
			source.push(")(true, ");
			source.push(JSON.stringify(nonce));
			source.push(", ");
			source.push(JSON.stringify(origin));
			source.push(", (function () { return \"\"; }), [ ");
			source.push(JSON.stringify(can_request));
			source.push(" , ");
			source.push(JSON.stringify(can_perform));
			source.push(" , ");

			// Setup entries
			source.push("[");
			for (i = 0; i < entries.length; ++i) {
				if (i > 0) source.push(",");
				source.push("{name:");
				source.push(JSON.stringify(entries[i].name));
				source.push(",events:");
				source.push(JSON.stringify(entries[i].name));
				source.push(",request:");
				source.push(can_request ? entries[i].request.toString() : "null");
				source.push(",perform:");
				source.push(can_perform ? entries[i].perform.toString() : "null");
				source.push("}");
			}
			source.push("] ]);");

			// Inject
			scr = document.createElement("script");
			scr.innerHTML = source.join("");

			document.head.appendChild(scr);
			document.head.removeChild(scr);
		};



		// Source for the task manager, wrapped in a function scope (for stringification)
		var script = function (create_new, nonce, origin, id_generator, register_args) {
			// Task object
			var TaskManager = function (nonce, origin, id_generator) {
				// Message listener
				this.on_window_message_bind = on_window_message.bind(this);
				window.addEventListener("message", this.on_window_message_bind, false);

				// Vars
				this.nonce = nonce;
				this.origin = origin;
				this.other = null;

				this.events = {};
				this.request = {};
				this.perform = {};

				this.active = {};

				// Init
				this.id_generator = id_generator;
			};



			// Private
			var on_window_message = function (event) {
				// Origin check
				if (event.origin != this.origin) return;

				// Decode data
				var data;
				try {
					data = JSON.parse(event.data);
				}
				catch (e) {
					return;
				}

				// Check if it's from a valid source
				if ("nonce" in data && data.nonce == this.nonce) {
					// Process
					if (data.request) this.receive_request(data);
					else this.receive_reply(data);
				}
			};

			var wrapped_request = function (type, data_function, input_data) {
				// Generate id
				var id = this.id_generator(64);

				// Setup callbacks
				if ("on" in input_data) {
					var new_events = {},
						event_list = [],
						event_name;

					for (event_name in input_data.on) {
						new_events[event_name] = input_data.on[event_name];
						event_list.push(event_name);
					}

					// Replace with list
					delete input_data["on"];
					input_data.events = event_list;

					// Add an active task
					this.active[id] = {
						type: type,
						events: new_events,
					};
				}

				// Send
				this.send_request(id, type, data_function.call(this, input_data));
			};



			// Public
			TaskManager.prototype = {
				constructor: TaskManager,

				task_started: function (id, type) {
					this.send_reply(id, type, {
						type: "started",
					});
				},
				task_completed: function (id, type) {
					this.send_reply(id, type, {
						type: "complete",
					});
				},

				send_reply: function (id, type, data) {
					// Create
					var metadata = {
						nonce: this.nonce,
						request: false,
						id: id,
						type: type,
						data: data,
					};

					// Send
					if (this.other) this.other.receive_reply(metadata);
					else window.postMessage(JSON.stringify(metadata), this.origin);
				},
				send_request: function (id, type, data) {
					// Create
					var metadata = {
						nonce: this.nonce,
						request: true,
						id: id,
						type: type,
						data: data,
					};

					// Send
					if (this.other) this.other.receive_request(metadata);
					else window.postMessage(JSON.stringify(metadata), this.origin);
				},
				receive_reply: function (metadata) {
					if (metadata.id in this.active) {
						var data = metadata.data,
							entry = this.active[metadata.id];

						if (data.type == "complete") {
							// Remove
							delete this.active[metadata.id];
						}
						// else if (data.type == "start") {}
						else if (data.type == "event") {
							// Trigger event
							if (data.event in entry.events) {
								entry.events[data.event].call(this, data.event_data, data.event);
							}
						}
					}
				},
				receive_request: function (metadata) {
					if (metadata.type in this.perform) {
						this.perform[metadata.type].call(this, metadata.id, metadata.type, metadata.data);
					}
				},

				register: function (can_request, can_perform, entries) {
					var fn, i;
					for (i = 0; i < entries.length; ++i) {
						// Event list
						this.events[entries[i].name] = entries[i].events;

						// Extract request function from scope
						if (can_request && (fn = entries[i].request) && (fn = fn())) {
							this.request[entries[i].name] = wrapped_request.bind(this, entries[i].name, fn);
						}

						// Extract perform function from scope
						if (can_perform && (fn = entries[i].perform) && (fn = fn())) {
							this.perform[entries[i].name] = fn.bind(this);
						}
					}
				},
			};



			// Done
			var task_manager = null;
			if (create_new) {
				task_manager = new TaskManager(nonce, origin, id_generator);
				task_manager.register.apply(task_manager, register_args);
			}
			return TaskManager;
		};



		// Tasks
		var RequestXHR = {
			name: "xhr",
			events: [ "load" , "abort" , "error" , "loadend" ],
			request: function () {

				return function (xhr_data) {
					var data = {
						form_data: xhr_data.form_data || null,
						method: xhr_data.method || "GET",
						url: xhr_data.url,
						events: xhr_data.events,
					};
					return data;
				};

			},
			perform: function () {

				var on_task_xhr_generic = function (task, event) {
					if (task.events.indexOf(event.type) >= 0) {
						this.send_reply(task.id, task.type, {
							type: "event",
							event: event.type,
							event_data: {
								response: task.xhr.response,
								status: task.xhr.status,
								status_text: task.xhr.statusText,
							},
						});
					}
				};
				var on_task_xhr_loadend = function (task, event) {
					if (task.events.indexOf(event.type) >= 0) {
						this.send_reply(task.id, task.type, {
							type: "event",
							event: event.type,
							event_data: {
								status: task.xhr.status,
								status_text: task.xhr.statusText,
							},
						});
					}

					// Done
					task.xhr = null;
					this.task_completed(task.id, task.type);
				};


				return function (id, type, data) {
					// Form data
					var form_data = null;
					if ("form_data" in data && data.form_data !== null) {
						if (typeof(data.form_data) == "string") {
							// String
							form_data = data.form_data;
						}
						else {
							// Object
							form_data = new FormData();
							for (var key in data.form_data) {
								form_data.append(key, data.form_data[key]);
							}
						}
					}

					// Create xhr
					var task = {
						id: id,
						type: type,
						events: data.events || [],
						xhr: new XMLHttpRequest(),
					};
					task.xhr.open(data.method, data.url, true);
					task.xhr.responseType = "text";

					var generic_bind = on_task_xhr_generic.bind(this, task);
					task.xhr.addEventListener("load", generic_bind, false);
					task.xhr.addEventListener("abort", generic_bind, false);
					task.xhr.addEventListener("error", generic_bind, false);
					task.xhr.addEventListener("loadend", on_task_xhr_loadend.bind(this, task), false);

					// Start
					if (form_data !== null) task.xhr.send(form_data);
					else task.xhr.send();

					// Reply
					this.task_started(id, type);
				};

			},
		};



		// Create new
		var TaskManager = script(false);
		var task_manager = null;
		var create_task_manager = function () {
			// Inject or not
			var inject_into_page = (window.chrome) ? true : false;

			// Entries
			var reg_entries = [ RequestXHR ];

			// Requester
			var tmr = new TaskManager(
				generate_random_str(128),
				window.location.protocol + "//" + window.location.host,
				generate_random_str
			);
			tmr.register(true, false, reg_entries);

			// Begin
			if (inject_into_page) {
				// Inside a script tag
				inject(tmr.nonce, tmr.origin, false, true, reg_entries);
			}
			else {
				// Performer
				var tmp = new TaskManager(tmr.nonce, tmr.origin, generate_random_str);
				tmp.register(false, true, reg_entries);

				// Link
				tmr.other = tmp;
				tmp.other = tmr;
			}

			// Done
			return tmr;
		};



		return function (data) {
			if (task_manager === null) task_manager = create_task_manager();

			return task_manager.request.xhr(data);
		};

	})();



	// YouTube watcher
	var YouTube = (function () {

		var MutationObserver = (window.MutationObserver || window.WebKitMutationObserver);



		var YouTube = function () {
			// Document listening
			this.doc_observer = null;
			this.profile_card_observers = [];

			this.session_token = null;
			this.session_token_callbacks = [];
			this.on_window_message_session_token_bind = null;

			this.active_uploads_contain_observer = null;
			this.active_upload_observers = [];

			this.queued_files = [];
			this.queued_files_clear_timeout = null;

			this.upload_buttons_observer = null;
			this.upload_file_input = null;

			this.player_api_annotation_button_observer = null;
			this.player_api_annotation_button = null;
			this.player_api_annotation_buttons_original = null;
		};



		var hook_document_observer = function () {
			if (this.doc_observer === null) {
				var el = document.documentElement;
				if (!el) return;

				// Create new observer
				this.doc_observer = new MutationObserver(on_document_observe.bind(this));

				// Observe
				this.doc_observer.observe(
					el,
					{
						childList: true,
						subtree: true,
					}
				);
			}
		};

		var on_document_observe = function (records) {
			var nodes, n, i, j, k, im, jm, km, pc;
			i = 0;
			im = records.length;
			for (; i < im; ++i) {
				if ((nodes = records[i].addedNodes)) {
					j = 0;
					jm = nodes.length;
					for (; j < jm; ++j) {
						// Check
						n = nodes[j];

						if (n.nodeType == 1 && n.classList.contains("yt-uix-clickcard-card")) {
							hook_profile_card_observer.call(this, n);
						}
					}
				}
				if ((nodes = records[i].removedNodes)) {
					j = 0;
					jm = nodes.length;
					for (; j < jm; ++j) {
						// Check
						n = nodes[j];

						if (n.nodeType == 1 && n.classList.contains("yt-uix-clickcard-card")) {
							unhook_profile_card_observer.call(this, n);
						}
					}
				}
			}
		};
		var on_profile_card_observe = function (data, records) {
			var i, r;

			for (i = 0; i < records.length; ++i) {
				r = records[i];

				if (r.attributeName == "class") {
					// Detect
					if (r.target.classList.contains("yt-uix-clickcard-card-visible")) {
						profile_card_show.call(this, r.target);
					}
					else {
						profile_card_hide.call(this, r.target);
					}
				}
			}
		};

		var on_window_message_session_token = function (nonce, origin, event) {
			// Origin check
			if (event.origin != origin) return;

			// Decode data
			var data;
			try {
				data = JSON.parse(event.data);
			}
			catch (e) {
				return;
			}

			// Check if it's from a valid source
			if ("nonce" in data && data.nonce == nonce && "session_token" in data) {
				this.session_token = data.session_token;
				window.removeEventListener("message", this.on_window_message_session_token_bind, false);
				this.on_window_message_session_token_bind = null;

				// Callback
				trigger_session_token_callbacks.call(this);
			}
		};

		var on_queued_files_clear_timeout = function () {
			// Remove files from queue (if something takes too long for some reason)
			this.queued_files.splice(0, this.queued_files.length);
		};
		var on_body_drop = function (event) {
			for (var i = 0; i < event.dataTransfer.files.length; ++i) {
				this.queued_files.push(event.dataTransfer.files[i]);
			}

			if (this.queued_files_clear_timeout !== null) clearTimeout(this.queued_files_clear_timeout);
			this.queued_files_clear_timeout = setTimeout(on_queued_files_clear_timeout.bind(this), 2000);
		};
		var on_upload_input_file_change = function (node, event) {
			// This does not work; oh well (node.files.length == 0 since the site nullifies it)
		};

		var on_active_uploads_contain_observe = function (records) {
			var nodes, n, i, j, im, jm;
			i = 0;
			im = records.length;
			for (; i < im; ++i) {
				if ((nodes = records[i].addedNodes)) {
					j = 0;
					jm = nodes.length;
					for (; j < jm; ++j) {
						// Check
						n = nodes[j];

						if (n.nodeType == 1 && n.classList.contains("upload-item")) {
							hook_active_upload_observer.call(this, n);
						}
					}
				}
			}
		};
		var hook_active_uploads_contain_observer = function () {
			if (this.active_uploads_contain_observer === null) {
				var el = document.getElementById("active-uploads-contain");
				if (!el) return;

				// Create new observer
				this.active_uploads_contain_observer = new MutationObserver(on_active_uploads_contain_observe.bind(this));

				// Observe
				this.active_uploads_contain_observer.observe(
					el,
					{
						childList: true,
					}
				);
			}
		};
		var on_uploader_buttons_observe = function (records) {
			var nodes, n, i, j, im, jm;
			i = 0;
			im = records.length;
			for (; i < im; ++i) {
				if ((nodes = records[i].addedNodes)) {
					j = 0;
					jm = nodes.length;
					for (; j < jm; ++j) {
						// Check
						n = nodes[j];

						if (n.tagName == "INPUT" && n.getAttribute("type") == "file") {
							// Done
							this.upload_file_input = n;
							hook_upload_input_file_events.call(this);

							// Unhook
							this.upload_buttons_observer.disconnect();
							this.upload_buttons_observer = null;
						}
					}
				}
			}
		};
		var hook_uploader_buttons_observer = function (node) {
			if (this.upload_buttons_observer === null) {
				// Create new observer
				this.upload_buttons_observer = new MutationObserver(on_uploader_buttons_observe.bind(this));

				// Observe
				this.upload_buttons_observer.observe(
					node,
					{
						childList: true,
					}
				);
			}
		};

		var on_watch_page_link_observe = function (data, records) {
			var nodes, n, i, j, im, jm;
			i = 0;
			im = records.length;
			for (; i < im; ++i) {
				if ((nodes = records[i].addedNodes)) {
					j = 0;
					jm = nodes.length;
					for (; j < jm; ++j) {
						// Check
						n = nodes[j];

						if (n.tagName == "A") {
							// Set the video id
							data.video_id = get_youtube_video_id_from_url.call(this, n.getAttribute("href") || "");
							if (data.video_id !== null) {
								// Un-hide custom buttons
								data.cancel_button1.style.display = "";
								data.cancel_button1.classList.remove("hid");
								//data.cancel_button2.style.display = "";
								//data.cancel_button2.classList.remove("hid");
							}
						}
					}
				}
			}
		};
		var on_active_upload_cancel_button_click = function (data, main_button, delete_upload, restart_upload, event) {
			if (event.which === 1) {
				// Cancel
				main_button.click();

				// Restart callback
				var next_callback = on_active_upload_cancel_restart_callback.bind(this, data, restart_upload);

				// Delete
				if (delete_upload && data.video_id !== null) {
					// Delete
					delete_youtube_video.call(this, data.video_id, on_active_upload_cancel_delete_callback.bind(this, data, next_callback));
				}
				else {
					next_callback.call(this);
				}
			}

			// Stop
			event.preventDefault();
			event.stopPropagation();
			return false;
		};
		var on_active_upload_cancel_delete_callback = function (data, next_callback, obj, deleted, errors) {
			var node = data.node.querySelector(".upload-failure");

			if (node !== null) {
				if (deleted) {
					// Update message
					node.textContent = "The upload was canceled and deleted.";
				}
				else {
					// Display errors
					node.textContent = "The upload was canceled, but " + (errors.length == 1 ? "a " : "") + "deletion error" + (errors.length == 1 ? "" : "s") + " occured:";
					var error_container = document.createElement("div"),
						div, i;

					error_container.style.display = "inline-block";
					error_container.style.marginTop = "0.5em";
					error_container.style.textAlign = "left";
					error_container.style.fontSize = "0.8em";

					for (i = 0; i < errors.length; ++i) {
						div = document.createElement("div");
						div.textContent = "- " + errors[i];
						error_container.appendChild(div);
					}

					node.appendChild(document.createElement("br"));
					node.appendChild(error_container);
				}
			}

			if (next_callback) {
				next_callback.call(null, deleted);
			}
		};
		var on_active_upload_cancel_restart_callback = function (data, restart_upload, deleted) {
			if (deleted && restart_upload && this.upload_file_input !== null) {
				// Hide
				data.node.classList.add("hid");
				data.node.style.display = "none";

				// Get the file
				var file = data.file;

				// TODO : Simulate drop event on body
				// this could be done by hijacking "www-upload.js" and injecting some code into the inner scope which allows simulation of a file event (files would have to be stored in an array on the browser <script> side)
			}

			// Unhook
			unhook_active_upload_observer.call(this, data.node);
		};
		var hook_active_upload_observer = function (node) {
			if (this.queued_files.length == 0) return;

			// Not already added?
			for (var i = 0; i < this.active_upload_observers.length; ++i) {
				if (this.active_upload_observers[i].node == node) return;
			}

			// Add
			var data = {
				node: node,
				file: null,
				video_id: null,
				cancel_button1: null,
				cancel_button2: null,
				on_cancel_button1_click: null,
				on_cancel_button2_click: null,
				watch_page_link_observer: null,
			};
			this.active_upload_observers.push(data);


			// Set file
			data.file = this.queued_files[0];
			this.queued_files.splice(0, 1);


			// Add the watch page link
			var node;
			if ((node = data.node.querySelector(".watch-page-link")) !== null) {
				// Create new observer
				data.watch_page_link_observer = new MutationObserver(on_watch_page_link_observe.bind(this, data));

				// Observe
				data.watch_page_link_observer.observe(
					node,
					{
						childList: true,
					}
				);
			}


			// Find cancel dialog
			if ((node = data.node.querySelector(".confirm-cancel-dialog")) !== null) {
				if ((node = node.querySelector(".yt-dialog-fg>.yt-dialog-fg-content>.yt-dialog-footer")) !== null) {
					// Modify buttons
					var main_button, button, text;

					if ((main_button = node.querySelector(".yt-uix-button.yt-uix-button-primary")) !== null) {
						// Setup events
						data.on_cancel_button1_click = on_active_upload_cancel_button_click.bind(this, data, main_button, true, false);
						data.on_cancel_button2_click = on_active_upload_cancel_button_click.bind(this, data, main_button, true, true);


						// Add a new button
						button = document.createElement("button");
						button.setAttribute("type", "button");
						button.addEventListener("click", data.on_cancel_button1_click, false);
						button.className = "yt-uix-button yt-uix-button-size-default yt-uix-button-destructive yt-dialog-dismiss hid";
						button.style.display = "none";

						text = document.createElement("span");
						text.className = "yt-uix-button-content";
						text.textContent = "Cancel & Delete";
						button.appendChild(text);

						data.cancel_button1 = button;
						node.appendChild(button);

						// Add a new button
						button = document.createElement("button");
						button.setAttribute("type", "button");
						button.addEventListener("click", data.on_cancel_button2_click, false);
						button.className = "yt-uix-button yt-uix-button-size-default yt-uix-button-payment yt-dialog-dismiss hid";
						button.style.display = "none";

						text = document.createElement("span");
						text.className = "yt-uix-button-content";
						text.textContent = "Cancel & Restart";
						button.appendChild(text);

						data.cancel_button2 = button;
						node.appendChild(button);
					}
				}
			}
		};
		var unhook_active_upload_observer = function (node) {
			// Not already added?
			for (var i = 0; i < this.active_upload_observers.length; ++i) {
				if (this.active_upload_observers[i].node == node) {
					var data = this.active_upload_observers[i],
						par;

					// Remove stuff
					if (data.cancel_button1 !== null) {
						if (data.on_cancel_button1_click) data.cancel_button1.removeEventListener("click", data.on_cancel_button1_click, false);
						if ((par = data.cancel_button1.parentNode) !== null) par.removeChild(data.cancel_button1);
					}
					if (data.cancel_button2 !== null) {
						if (data.on_cancel_button2_click) data.cancel_button2.removeEventListener("click", data.on_cancel_button2_click, false);
						if ((par = data.cancel_button2.parentNode) !== null) par.removeChild(data.cancel_button2);
					}
					data.file = null;

					// Disconnect
					if (data.watch_page_link_observer !== null) data.watch_page_link_observer.disconnect();
					this.active_upload_observers.splice(i, 1)

					// Done
					return;
				}
			}
		};

		var hook_profile_card_observer = function (node) {
			// Not already added?
			for (var i = 0; i < this.profile_card_observers.length; ++i) {
				if (this.profile_card_observers[i].node == node) return;
			}

			// Data
			var data = {
				node: node,
				observer: null,
			};

			// Create new observer
			data.observer = new MutationObserver(on_profile_card_observe.bind(this, data));

			// Observe
			data.observer.observe(
				node,
				{
					attributes: true,
				}
			);

			// Add
			this.profile_card_observers.push(data);

			// Events
			profile_card_init.call(this, node);
			if (node.classList.contains("yt-uix-clickcard-card-visible")) {
				profile_card_show.call(this, node);
			}
			else {
				profile_card_hide.call(this, node);
			}
		};
		var unhook_profile_card_observer = function (node) {
			// Not already added?
			for (var i = 0; i < this.profile_card_observers.length; ++i) {
				if (this.profile_card_observers[i].node == node) {
					// Remove
					this.profile_card_observers[i].observer.disconnect();
					this.profile_card_observers.splice(i, 1)

					// Done
					return;
				}
			}
		};

		var profile_card_init = function (node) {
			var footer = node.querySelector(".yt-masthead-picker-footer"),
				par, c, link;

			if (footer !== null && (par = footer.parentNode) !== null) {
				c = document.createElement("div");
				c.style.margin = "0";
				c.style.padding = "15px";
				c.style.borderTop = "1px solid rgba(0,0,0,0.1)";

				link = document.createElement("a");
				link.style.display = "block";
				link.setAttribute("href", "https://www.youtube.com/my_videos");
				link.setAttribute("rel", "noreferrer nofollow");
				link.textContent = "My Videos";
				c.appendChild(link);

				link = document.createElement("a");
				link.style.display = "block";
				link.setAttribute("href", "https://www.youtube.com/feed/history");
				link.setAttribute("rel", "noreferrer nofollow");
				link.textContent = "History";
				c.appendChild(link);

				link = document.createElement("a");
				link.style.display = "block";
				link.setAttribute("href", "https://www.youtube.com/view_all_playlists");
				link.setAttribute("rel", "noreferrer nofollow");
				link.textContent = "Playlists";
				c.appendChild(link);

				// Append
				par.insertBefore(c, footer);
			}
		};
		var profile_card_show = function (node) {
		};
		var profile_card_hide = function (node) {
		};

		var trigger_session_token_callbacks = function () {
			// Trigger events and clear callbacks
			for (var i = 0; i < this.session_token_callbacks.length; ++i) {
				this.session_token_callbacks[i].call(null, this);
			}

			this.session_token_callbacks = null;
		};
		var find_session_token = function (callback) {
			// Update callbacks
			if (this.session_token_callbacks === null) {
				// Already done
				if (callback) callback.call(null, this);
				return;
			}
			else if (callback) {
				this.session_token_callbacks.push(callback);
			}

			// Find as an input
			var node = document.querySelector("input[name=session_token]");
			if (node !== null) {
				this.session_token = node.value || "";
				trigger_session_token_callbacks.call(this);
			}
			else {
				// Nonce generator (to filter out any other messages that could come through for some reason)
				var nonce = "",
					nonce_chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-",
					nonce_length = 128,
					origin = window.location.protocol + "//" + window.location.host,
					i;

				for (i = 0; i < nonce_length; ++i) {
					nonce += nonce_chars[Math.floor(Math.random() * nonce_chars.length)];
				}

				// Message listener
				this.on_window_message_session_token_bind = on_window_message_session_token.bind(this, nonce, origin);
				window.addEventListener("message", this.on_window_message_session_token_bind, false);

				// Inject script
				var scr = document.createElement("script");
				scr.innerHTML = "(" + session_token_sender.toString() + ")(" + JSON.stringify(nonce) + ", " + JSON.stringify(origin) + ");";
				document.head.appendChild(scr);
				document.head.removeChild(scr);
			}
		};
		var session_token_sender = function (nonce, origin) {
			var st = null;
			try {
				st = session_token;
			}
			catch (e) {
				st = null;
			}

			window.postMessage(JSON.stringify({
				session_token: st,
				nonce: nonce,
			}), origin);
		};

		var setup_upload_form = function () {
			// Session token not found
			if (this.session_token === null) return;

			// Drop file event
			document.body.addEventListener("drop", on_body_drop.bind(this), false);

			// Input file node
			var node = document.querySelector('.upload-footer>.uploader-buttons');
			if ((this.upload_file_input = node.querySelector('input[type="file"]')) === null) {
				// Setup observer
				hook_uploader_buttons_observer.call(this, node);
			}
			else {
				hook_upload_input_file_events.call(this);
			}

			// Observe more stuff
			hook_active_uploads_contain_observer.call(this);
		};
		var hook_upload_input_file_events = function () {
			this.upload_file_input.addEventListener("change", on_upload_input_file_change.bind(this, this.upload_file_input), false);
		};

		var get_youtube_video_id_from_url = function (url) {
			var m = /^(?:https?\:)?(?:\/*)(?:[^\/]+\.)?(?:youtu|y2u)\.be\/([a-zA-Z0-9_-]{11})/i.exec(url);
			if (m) return m[1];
			return null;
		};

		var delete_youtube_video = function (video_id, callback) {
			// Invalid
			if (this.session_token === null) {
				if (callback) callback.call(null, this, false, [ "No session token" ]);
				return;
			}

			// Create XHR request
			var data = {
				okay: false,
				errors: null,
				callback: callback,
			};
			XHR({
				url: "/video_ajax?num_videos=1&action_delete_videos=1&o=U",
				method: "POST",
				form_data: {
					v: video_id,
					session_token: this.session_token,
				},
				on: {
					load: on_delete_youtube_video_ajax_load.bind(this, data),
					abort: on_delete_youtube_video_ajax_abort.bind(this, data),
					error: on_delete_youtube_video_ajax_error.bind(this, data),
					loadend: on_delete_youtube_video_ajax_loadend.bind(this, data),
				}
			});
		};
		var on_delete_youtube_video_ajax_load = function (data, event) {
			// Convert to JSON object
			var response = event.response;
			try {
				response = JSON.parse(response);
			}
			catch (e) {
				response = null;
			}

			if (event.status == 200) {
				if (response && "errors" in response && response.errors.length > 0) {
					// Errors
					data.errors = response.errors;
				}
				else {
					// Successful
					data.okay = true;
				}
			}
			else {
				// Bad status
				data.errors = [ "Invalid status: " + (event.status_text.length > 0 ? " / " + event.status_text : "") ];
			}
		};
		var on_delete_youtube_video_ajax_abort = function (data, event) {
			data.errors = [ "AJAX aborted" ];
		};
		var on_delete_youtube_video_ajax_error = function (data, event) {
			data.errors = [ "AJAX error: " + event.status + (event.status_text.length > 0 ? " / " + event.status_text : "") ];
		};
		var on_delete_youtube_video_ajax_loadend = function (data, event) {
			// Trigger the callback
			if (data.callback) data.callback.call(null, this, data.okay, data.errors);
		};

		var inject_styles = function () {
			var style = document.createElement("style");
			style.innerHTML = "\
.uyt-video-button {\
background-color: transparent;\
background-image: url('data:image/png;base64,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');\
background-size: 124px 26px;\
background-repeat: no-repeat;\
width: 30px;\
height: 27px;\
float: right;\
}\
.uyt-annotations-button.uyt-annotations-button-active {\
background-position: -31px 1px;\
}\
.uyt-annotations-button.uyt-annotations-button-active:hover {\
background-position: 0px 1px;\
}\
.uyt-annotations-button {\
background-position: -93px 1px;\
}\
.uyt-annotations-button:hover {\
background-position: -62px 1px;\
}\
";

			if (document.head) document.head.appendChild(style);
		};

		var hook_player_api_observer = function () {
			if (this.player_api_annotation_button_observer !== null) return;

			var player_api, movie_player, annotation_options, cog_button;
			if (
				(player_api = document.getElementById("player-api")) === null ||
				(movie_player = player_api.querySelector("#movie_player")) === null ||
				(annotation_options = movie_player.querySelectorAll(".ytp-menu-row>.ytp-menu-cell:not(.ytp-menu-title)>.ytp-segmented-control>.ytp-button[tabindex='2200']")).length != 2 ||
				(cog_button = movie_player.querySelector(".ytp-button.ytp-settings-button")) === null
			) return;


			// Create new observer
			this.player_api_annotation_button_observer = new MutationObserver(on_player_api_annotation_button_observe.bind(this));

			// Observe
			this.player_api_annotation_button_observer.observe(
				annotation_options[0],
				{
					attributes: true,
				}
			);

			// Create new button
			var ann_button = document.createElement("div");
			ann_button.className = "ytp-button uyt-video-button uyt-annotations-button";
			ann_button.setAttribute("role", "button");
			ann_button.setAttribute("tabindex", "6550");
			ann_button.setAttribute("aria-label", "Annotations");
			ann_button.setAttribute("aria-haspopup", "false");
			ann_button.setAttribute("aria-pressed", "false");

			if (annotation_options[0].classList.contains("ytp-segmented-control-selected")) {
				ann_button.classList.add("uyt-annotations-button-active");
			}

			ann_button.addEventListener("click", on_player_api_annotation_button_click.bind(this), false);

			if (cog_button.nextSibling !== null) {
				cog_button.parentNode.insertBefore(ann_button, cog_button.nextSibling);
			}
			else {
				cog_button.parentNode.appendChild(ann_button);
			}

			this.player_api_annotation_button = ann_button;
			this.player_api_annotation_buttons_original = annotation_options;
		};

		var on_player_api_annotation_button_observe = function (records) {
			var i, r;

			for (i = 0; i < records.length; ++i) {
				r = records[i];

				if (r.attributeName == "class") {
					// Update button
					if (r.target.classList.contains("ytp-segmented-control-selected")) {
						this.player_api_annotation_button.classList.add("uyt-annotations-button-active");
					}
					else {
						this.player_api_annotation_button.classList.remove("uyt-annotations-button-active");
					}
				}
			}
		};
		var on_player_api_annotation_button_click = function (event) {
			if (event.which && event.which !== 1) return;
			var click_id = this.player_api_annotation_buttons_original[0].classList.contains("ytp-segmented-control-selected") ? 1 : 0;
			this.player_api_annotation_buttons_original[click_id].click();
		};



		YouTube.prototype = {
			constructor: YouTube,

			setup: function () {
				inject_styles.call(this);

				hook_document_observer.call(this);

				hook_player_api_observer.call(this);

				if (this.is_upload_page()) {
					find_session_token.call(this, setup_upload_form.bind(this));
				}
			},
			is_upload_page: function () {
				return (window.location.pathname == "/upload");
			},

		};



		return YouTube;

	})();



	// Init
	var yt = new YouTube();

	// Setup as soon as possible
	ASAP.asap(function () {
		yt.setup();
	});

})();


