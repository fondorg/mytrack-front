
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                info.blocks[i] = null;
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
                if (!info.hasCatch) {
                    throw error;
                }
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.29.7' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/Tailwindcss.svelte generated by Svelte v3.29.7 */

    function create_fragment(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Tailwindcss", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tailwindcss> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Tailwindcss extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tailwindcss",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src/c8s/CenteredFlex.svelte generated by Svelte v3.29.7 */

    const file = "src/c8s/CenteredFlex.svelte";

    function create_fragment$1(ctx) {
    	let div1;
    	let div0;
    	let div0_class_value;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div0, "class", div0_class_value = "flex flex-col items-center w-full " + /*extraClasses*/ ctx[0]);
    			add_location(div0, file, 5, 4, 138);
    			attr_dev(div1, "class", "container flex flex-grow mx-auto items-center justify-center mt-2");
    			add_location(div1, file, 4, 0, 54);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 2) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[1], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*extraClasses*/ 1 && div0_class_value !== (div0_class_value = "flex flex-col items-center w-full " + /*extraClasses*/ ctx[0])) {
    				attr_dev(div0, "class", div0_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("CenteredFlex", slots, ['default']);
    	let { extraClasses = "" } = $$props;
    	const writable_props = ["extraClasses"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<CenteredFlex> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("extraClasses" in $$props) $$invalidate(0, extraClasses = $$props.extraClasses);
    		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ extraClasses });

    	$$self.$inject_state = $$props => {
    		if ("extraClasses" in $$props) $$invalidate(0, extraClasses = $$props.extraClasses);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [extraClasses, $$scope, slots];
    }

    class CenteredFlex extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { extraClasses: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CenteredFlex",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get extraClasses() {
    		throw new Error("<CenteredFlex>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set extraClasses(value) {
    		throw new Error("<CenteredFlex>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/c8s/Header.svelte generated by Svelte v3.29.7 */

    const file$1 = "src/c8s/Header.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			attr_dev(img, "class", "w-32");
    			if (img.src !== (img_src_value = "/img/logo_1.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file$1, 1, 4, 10);
    			add_location(div, file$1, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Header", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn, basedir, module) {
    	return module = {
    	  path: basedir,
    	  exports: {},
    	  require: function (path, base) {
          return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
        }
    	}, fn(module, module.exports), module.exports;
    }

    function commonjsRequire () {
    	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
    }

    var oidcClient_min = createCommonjsModule(function (module, exports) {
    !function t(e,r){module.exports=r();}(commonjsGlobal,function(){return function(t){var e={};function r(n){if(e[n])return e[n].exports;var i=e[n]={i:n,l:!1,exports:{}};return t[n].call(i.exports,i,i.exports,r),i.l=!0,i.exports}return r.m=t,r.c=e,r.d=function(t,e,n){r.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:n});},r.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0});},r.t=function(t,e){if(1&e&&(t=r(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var n=Object.create(null);if(r.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var i in t)r.d(n,i,function(e){return t[e]}.bind(null,i));return n},r.n=function(t){var e=t&&t.__esModule?function e(){return t.default}:function e(){return t};return r.d(e,"a",e),e},r.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},r.p="",r(r.s=22)}([function(t,e,r){Object.defineProperty(e,"__esModule",{value:!0});var n=function(){function t(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n);}}return function(e,r,n){return r&&t(e.prototype,r),n&&t(e,n),e}}();var i={debug:function t(){},info:function t(){},warn:function t(){},error:function t(){}},o=void 0,s=void 0;(e.Log=function(){function t(){!function e(t,r){if(!(t instanceof r))throw new TypeError("Cannot call a class as a function")}(this,t);}return t.reset=function t(){s=3,o=i;},t.debug=function t(){if(s>=4){for(var e=arguments.length,r=Array(e),n=0;n<e;n++)r[n]=arguments[n];o.debug.apply(o,Array.from(r));}},t.info=function t(){if(s>=3){for(var e=arguments.length,r=Array(e),n=0;n<e;n++)r[n]=arguments[n];o.info.apply(o,Array.from(r));}},t.warn=function t(){if(s>=2){for(var e=arguments.length,r=Array(e),n=0;n<e;n++)r[n]=arguments[n];o.warn.apply(o,Array.from(r));}},t.error=function t(){if(s>=1){for(var e=arguments.length,r=Array(e),n=0;n<e;n++)r[n]=arguments[n];o.error.apply(o,Array.from(r));}},n(t,null,[{key:"NONE",get:function t(){return 0}},{key:"ERROR",get:function t(){return 1}},{key:"WARN",get:function t(){return 2}},{key:"INFO",get:function t(){return 3}},{key:"DEBUG",get:function t(){return 4}},{key:"level",get:function t(){return s},set:function t(e){if(!(0<=e&&e<=4))throw new Error("Invalid log level");s=e;}},{key:"logger",get:function t(){return o},set:function t(e){if(!e.debug&&e.info&&(e.debug=e.info),!(e.debug&&e.info&&e.warn&&e.error))throw new Error("Invalid logger");o=e;}}]),t}()).reset();},function(t,e,r){Object.defineProperty(e,"__esModule",{value:!0});var n=function(){function t(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n);}}return function(e,r,n){return r&&t(e.prototype,r),n&&t(e,n),e}}();var i={setInterval:function(t){function e(e,r){return t.apply(this,arguments)}return e.toString=function(){return t.toString()},e}(function(t,e){return setInterval(t,e)}),clearInterval:function(t){function e(e){return t.apply(this,arguments)}return e.toString=function(){return t.toString()},e}(function(t){return clearInterval(t)})},o=!1,s=null;e.Global=function(){function t(){!function e(t,r){if(!(t instanceof r))throw new TypeError("Cannot call a class as a function")}(this,t);}return t._testing=function t(){o=!0;},t.setXMLHttpRequest=function t(e){s=e;},n(t,null,[{key:"location",get:function t(){if(!o)return location}},{key:"localStorage",get:function t(){if(!o&&"undefined"!=typeof window)return localStorage}},{key:"sessionStorage",get:function t(){if(!o&&"undefined"!=typeof window)return sessionStorage}},{key:"XMLHttpRequest",get:function t(){if(!o&&"undefined"!=typeof window)return s||XMLHttpRequest}},{key:"timer",get:function t(){if(!o)return i}}]),t}();},function(t,e,r){Object.defineProperty(e,"__esModule",{value:!0}),e.MetadataService=void 0;var n=function(){function t(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n);}}return function(e,r,n){return r&&t(e.prototype,r),n&&t(e,n),e}}(),i=r(0),o=r(7);e.MetadataService=function(){function t(e){var r=arguments.length>1&&void 0!==arguments[1]?arguments[1]:o.JsonService;if(function n(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),!e)throw i.Log.error("MetadataService: No settings passed to MetadataService"),new Error("settings");this._settings=e,this._jsonService=new r(["application/jwk-set+json"]);}return t.prototype.getMetadata=function t(){var e=this;return this._settings.metadata?(i.Log.debug("MetadataService.getMetadata: Returning metadata from settings"),Promise.resolve(this._settings.metadata)):this.metadataUrl?(i.Log.debug("MetadataService.getMetadata: getting metadata from",this.metadataUrl),this._jsonService.getJson(this.metadataUrl).then(function(t){return i.Log.debug("MetadataService.getMetadata: json received"),e._settings.metadata=t,t})):(i.Log.error("MetadataService.getMetadata: No authority or metadataUrl configured on settings"),Promise.reject(new Error("No authority or metadataUrl configured on settings")))},t.prototype.getIssuer=function t(){return this._getMetadataProperty("issuer")},t.prototype.getAuthorizationEndpoint=function t(){return this._getMetadataProperty("authorization_endpoint")},t.prototype.getUserInfoEndpoint=function t(){return this._getMetadataProperty("userinfo_endpoint")},t.prototype.getTokenEndpoint=function t(){var e=!(arguments.length>0&&void 0!==arguments[0])||arguments[0];return this._getMetadataProperty("token_endpoint",e)},t.prototype.getCheckSessionIframe=function t(){return this._getMetadataProperty("check_session_iframe",!0)},t.prototype.getEndSessionEndpoint=function t(){return this._getMetadataProperty("end_session_endpoint",!0)},t.prototype.getRevocationEndpoint=function t(){return this._getMetadataProperty("revocation_endpoint",!0)},t.prototype.getKeysEndpoint=function t(){return this._getMetadataProperty("jwks_uri",!0)},t.prototype._getMetadataProperty=function t(e){var r=arguments.length>1&&void 0!==arguments[1]&&arguments[1];return i.Log.debug("MetadataService.getMetadataProperty for: "+e),this.getMetadata().then(function(t){if(i.Log.debug("MetadataService.getMetadataProperty: metadata recieved"),void 0===t[e]){if(!0===r)return void i.Log.warn("MetadataService.getMetadataProperty: Metadata does not contain optional property "+e);throw i.Log.error("MetadataService.getMetadataProperty: Metadata does not contain property "+e),new Error("Metadata does not contain property "+e)}return t[e]})},t.prototype.getSigningKeys=function t(){var e=this;return this._settings.signingKeys?(i.Log.debug("MetadataService.getSigningKeys: Returning signingKeys from settings"),Promise.resolve(this._settings.signingKeys)):this._getMetadataProperty("jwks_uri").then(function(t){return i.Log.debug("MetadataService.getSigningKeys: jwks_uri received",t),e._jsonService.getJson(t).then(function(t){if(i.Log.debug("MetadataService.getSigningKeys: key set received",t),!t.keys)throw i.Log.error("MetadataService.getSigningKeys: Missing keys on keyset"),new Error("Missing keys on keyset");return e._settings.signingKeys=t.keys,e._settings.signingKeys})})},n(t,[{key:"metadataUrl",get:function t(){return this._metadataUrl||(this._settings.metadataUrl?this._metadataUrl=this._settings.metadataUrl:(this._metadataUrl=this._settings.authority,this._metadataUrl&&this._metadataUrl.indexOf(".well-known/openid-configuration")<0&&("/"!==this._metadataUrl[this._metadataUrl.length-1]&&(this._metadataUrl+="/"),this._metadataUrl+=".well-known/openid-configuration"))),this._metadataUrl}}]),t}();},function(t,e,r){Object.defineProperty(e,"__esModule",{value:!0}),e.UrlUtility=void 0;var n=r(0),i=r(1);e.UrlUtility=function(){function t(){!function e(t,r){if(!(t instanceof r))throw new TypeError("Cannot call a class as a function")}(this,t);}return t.addQueryParam=function t(e,r,n){return e.indexOf("?")<0&&(e+="?"),"?"!==e[e.length-1]&&(e+="&"),e+=encodeURIComponent(r),e+="=",e+=encodeURIComponent(n)},t.parseUrlFragment=function t(e){var r=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"#",o=arguments.length>2&&void 0!==arguments[2]?arguments[2]:i.Global;"string"!=typeof e&&(e=o.location.href);var s=e.lastIndexOf(r);s>=0&&(e=e.substr(s+1)),"?"===r&&(s=e.indexOf("#"))>=0&&(e=e.substr(0,s));for(var a,u={},c=/([^&=]+)=([^&]*)/g,h=0;a=c.exec(e);)if(u[decodeURIComponent(a[1])]=decodeURIComponent(a[2]),h++>50)return n.Log.error("UrlUtility.parseUrlFragment: response exceeded expected number of parameters",e),{error:"Response exceeded expected number of parameters"};for(var l in u)return u;return {}},t}();},function(t,e,r){Object.defineProperty(e,"__esModule",{value:!0}),e.JoseUtil=void 0;var n=r(25),i=function o(t){return t&&t.__esModule?t:{default:t}}(r(32));e.JoseUtil=(0, i.default)({jws:n.jws,KeyUtil:n.KeyUtil,X509:n.X509,crypto:n.crypto,hextob64u:n.hextob64u,b64tohex:n.b64tohex,AllowedSigningAlgs:n.AllowedSigningAlgs});},function(t,e,r){Object.defineProperty(e,"__esModule",{value:!0}),e.OidcClientSettings=void 0;var n="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},i=function(){function t(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n);}}return function(e,r,n){return r&&t(e.prototype,r),n&&t(e,n),e}}(),o=r(0),s=r(6),a=r(23),u=r(2);var c="id_token",h="openid",l=900,f=300;e.OidcClientSettings=function(){function t(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},r=e.authority,i=e.metadataUrl,o=e.metadata,d=e.signingKeys,g=e.client_id,p=e.client_secret,v=e.response_type,y=void 0===v?c:v,m=e.scope,_=void 0===m?h:m,S=e.redirect_uri,F=e.post_logout_redirect_uri,b=e.prompt,w=e.display,E=e.max_age,x=e.ui_locales,k=e.acr_values,A=e.resource,P=e.response_mode,C=e.filterProtocolClaims,T=void 0===C||C,R=e.loadUserInfo,I=void 0===R||R,D=e.staleStateAge,U=void 0===D?l:D,L=e.clockSkew,B=void 0===L?f:L,N=e.userInfoJwtIssuer,O=void 0===N?"OP":N,j=e.stateStore,H=void 0===j?new s.WebStorageStateStore:j,M=e.ResponseValidatorCtor,K=void 0===M?a.ResponseValidator:M,V=e.MetadataServiceCtor,q=void 0===V?u.MetadataService:V,J=e.extraQueryParams,W=void 0===J?{}:J,z=e.extraTokenParams,Y=void 0===z?{}:z;!function G(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),this._authority=r,this._metadataUrl=i,this._metadata=o,this._signingKeys=d,this._client_id=g,this._client_secret=p,this._response_type=y,this._scope=_,this._redirect_uri=S,this._post_logout_redirect_uri=F,this._prompt=b,this._display=w,this._max_age=E,this._ui_locales=x,this._acr_values=k,this._resource=A,this._response_mode=P,this._filterProtocolClaims=!!T,this._loadUserInfo=!!I,this._staleStateAge=U,this._clockSkew=B,this._userInfoJwtIssuer=O,this._stateStore=H,this._validator=new K(this),this._metadataService=new q(this),this._extraQueryParams="object"===(void 0===W?"undefined":n(W))?W:{},this._extraTokenParams="object"===(void 0===Y?"undefined":n(Y))?Y:{};}return i(t,[{key:"client_id",get:function t(){return this._client_id},set:function t(e){if(this._client_id)throw o.Log.error("OidcClientSettings.set_client_id: client_id has already been assigned."),new Error("client_id has already been assigned.");this._client_id=e;}},{key:"client_secret",get:function t(){return this._client_secret}},{key:"response_type",get:function t(){return this._response_type}},{key:"scope",get:function t(){return this._scope}},{key:"redirect_uri",get:function t(){return this._redirect_uri}},{key:"post_logout_redirect_uri",get:function t(){return this._post_logout_redirect_uri}},{key:"prompt",get:function t(){return this._prompt}},{key:"display",get:function t(){return this._display}},{key:"max_age",get:function t(){return this._max_age}},{key:"ui_locales",get:function t(){return this._ui_locales}},{key:"acr_values",get:function t(){return this._acr_values}},{key:"resource",get:function t(){return this._resource}},{key:"response_mode",get:function t(){return this._response_mode}},{key:"authority",get:function t(){return this._authority},set:function t(e){if(this._authority)throw o.Log.error("OidcClientSettings.set_authority: authority has already been assigned."),new Error("authority has already been assigned.");this._authority=e;}},{key:"metadataUrl",get:function t(){return this._metadataUrl||(this._metadataUrl=this.authority,this._metadataUrl&&this._metadataUrl.indexOf(".well-known/openid-configuration")<0&&("/"!==this._metadataUrl[this._metadataUrl.length-1]&&(this._metadataUrl+="/"),this._metadataUrl+=".well-known/openid-configuration")),this._metadataUrl}},{key:"metadata",get:function t(){return this._metadata},set:function t(e){this._metadata=e;}},{key:"signingKeys",get:function t(){return this._signingKeys},set:function t(e){this._signingKeys=e;}},{key:"filterProtocolClaims",get:function t(){return this._filterProtocolClaims}},{key:"loadUserInfo",get:function t(){return this._loadUserInfo}},{key:"staleStateAge",get:function t(){return this._staleStateAge}},{key:"clockSkew",get:function t(){return this._clockSkew}},{key:"userInfoJwtIssuer",get:function t(){return this._userInfoJwtIssuer}},{key:"stateStore",get:function t(){return this._stateStore}},{key:"validator",get:function t(){return this._validator}},{key:"metadataService",get:function t(){return this._metadataService}},{key:"extraQueryParams",get:function t(){return this._extraQueryParams},set:function t(e){"object"===(void 0===e?"undefined":n(e))?this._extraQueryParams=e:this._extraQueryParams={};}},{key:"extraTokenParams",get:function t(){return this._extraTokenParams},set:function t(e){"object"===(void 0===e?"undefined":n(e))?this._extraTokenParams=e:this._extraTokenParams={};}}]),t}();},function(t,e,r){Object.defineProperty(e,"__esModule",{value:!0}),e.WebStorageStateStore=void 0;var n=r(0),i=r(1);e.WebStorageStateStore=function(){function t(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},r=e.prefix,n=void 0===r?"oidc.":r,o=e.store,s=void 0===o?i.Global.localStorage:o;!function a(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),this._store=s,this._prefix=n;}return t.prototype.set=function t(e,r){return n.Log.debug("WebStorageStateStore.set",e),e=this._prefix+e,this._store.setItem(e,r),Promise.resolve()},t.prototype.get=function t(e){n.Log.debug("WebStorageStateStore.get",e),e=this._prefix+e;var r=this._store.getItem(e);return Promise.resolve(r)},t.prototype.remove=function t(e){n.Log.debug("WebStorageStateStore.remove",e),e=this._prefix+e;var r=this._store.getItem(e);return this._store.removeItem(e),Promise.resolve(r)},t.prototype.getAllKeys=function t(){n.Log.debug("WebStorageStateStore.getAllKeys");for(var e=[],r=0;r<this._store.length;r++){var i=this._store.key(r);0===i.indexOf(this._prefix)&&e.push(i.substr(this._prefix.length));}return Promise.resolve(e)},t}();},function(t,e,r){Object.defineProperty(e,"__esModule",{value:!0}),e.JsonService=void 0;var n=r(0),i=r(1);e.JsonService=function(){function t(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:null,r=arguments.length>1&&void 0!==arguments[1]?arguments[1]:i.Global.XMLHttpRequest,n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:null;!function o(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),e&&Array.isArray(e)?this._contentTypes=e.slice():this._contentTypes=[],this._contentTypes.push("application/json"),n&&this._contentTypes.push("application/jwt"),this._XMLHttpRequest=r,this._jwtHandler=n;}return t.prototype.getJson=function t(e,r){var i=this;if(!e)throw n.Log.error("JsonService.getJson: No url passed"),new Error("url");return n.Log.debug("JsonService.getJson, url: ",e),new Promise(function(t,o){var s=new i._XMLHttpRequest;s.open("GET",e);var a=i._contentTypes,u=i._jwtHandler;s.onload=function(){if(n.Log.debug("JsonService.getJson: HTTP response received, status",s.status),200===s.status){var r=s.getResponseHeader("Content-Type");if(r){var i=a.find(function(t){if(r.startsWith(t))return !0});if("application/jwt"==i)return void u(s).then(t,o);if(i)try{return void t(JSON.parse(s.responseText))}catch(t){return n.Log.error("JsonService.getJson: Error parsing JSON response",t.message),void o(t)}}o(Error("Invalid response Content-Type: "+r+", from URL: "+e));}else o(Error(s.statusText+" ("+s.status+")"));},s.onerror=function(){n.Log.error("JsonService.getJson: network error"),o(Error("Network Error"));},r&&(n.Log.debug("JsonService.getJson: token passed, setting Authorization header"),s.setRequestHeader("Authorization","Bearer "+r)),s.send();})},t.prototype.postForm=function t(e,r){var i=this;if(!e)throw n.Log.error("JsonService.postForm: No url passed"),new Error("url");return n.Log.debug("JsonService.postForm, url: ",e),new Promise(function(t,o){var s=new i._XMLHttpRequest;s.open("POST",e);var a=i._contentTypes;s.onload=function(){if(n.Log.debug("JsonService.postForm: HTTP response received, status",s.status),200!==s.status){if(400===s.status)if(i=s.getResponseHeader("Content-Type"))if(a.find(function(t){if(i.startsWith(t))return !0}))try{var r=JSON.parse(s.responseText);if(r&&r.error)return n.Log.error("JsonService.postForm: Error from server: ",r.error),void o(new Error(r.error))}catch(t){return n.Log.error("JsonService.postForm: Error parsing JSON response",t.message),void o(t)}o(Error(s.statusText+" ("+s.status+")"));}else {var i;if((i=s.getResponseHeader("Content-Type"))&&a.find(function(t){if(i.startsWith(t))return !0}))try{return void t(JSON.parse(s.responseText))}catch(t){return n.Log.error("JsonService.postForm: Error parsing JSON response",t.message),void o(t)}o(Error("Invalid response Content-Type: "+i+", from URL: "+e));}},s.onerror=function(){n.Log.error("JsonService.postForm: network error"),o(Error("Network Error"));};var u="";for(var c in r){var h=r[c];h&&(u.length>0&&(u+="&"),u+=encodeURIComponent(c),u+="=",u+=encodeURIComponent(h));}s.setRequestHeader("Content-Type","application/x-www-form-urlencoded"),s.send(u);})},t}();},function(t,e,r){Object.defineProperty(e,"__esModule",{value:!0}),e.State=void 0;var n=function(){function t(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n);}}return function(e,r,n){return r&&t(e.prototype,r),n&&t(e,n),e}}(),i=r(0),o=function s(t){return t&&t.__esModule?t:{default:t}}(r(14));e.State=function(){function t(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},r=e.id,n=e.data,i=e.created,s=e.request_type;!function a(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),this._id=r||(0, o.default)(),this._data=n,this._created="number"==typeof i&&i>0?i:parseInt(Date.now()/1e3),this._request_type=s;}return t.prototype.toStorageString=function t(){return i.Log.debug("State.toStorageString"),JSON.stringify({id:this.id,data:this.data,created:this.created,request_type:this.request_type})},t.fromStorageString=function e(r){return i.Log.debug("State.fromStorageString"),new t(JSON.parse(r))},t.clearStaleState=function e(r,n){var o=Date.now()/1e3-n;return r.getAllKeys().then(function(e){i.Log.debug("State.clearStaleState: got keys",e);for(var n=[],s=function s(a){var c=e[a];u=r.get(c).then(function(e){var n=!1;if(e)try{var s=t.fromStorageString(e);i.Log.debug("State.clearStaleState: got item from key: ",c,s.created),s.created<=o&&(n=!0);}catch(t){i.Log.error("State.clearStaleState: Error parsing state for key",c,t.message),n=!0;}else i.Log.debug("State.clearStaleState: no item in storage for key: ",c),n=!0;if(n)return i.Log.debug("State.clearStaleState: removed item for key: ",c),r.remove(c)}),n.push(u);},a=0;a<e.length;a++){var u;s(a);}return i.Log.debug("State.clearStaleState: waiting on promise count:",n.length),Promise.all(n)})},n(t,[{key:"id",get:function t(){return this._id}},{key:"data",get:function t(){return this._data}},{key:"created",get:function t(){return this._created}},{key:"request_type",get:function t(){return this._request_type}}]),t}();},function(t,e,r){Object.defineProperty(e,"__esModule",{value:!0}),e.OidcClient=void 0;var n=function(){function t(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n);}}return function(e,r,n){return r&&t(e.prototype,r),n&&t(e,n),e}}(),i=r(0),o=r(5),s=r(11),a=r(12),u=r(36),c=r(37),h=r(38),l=r(13),f=r(8);e.OidcClient=function(){function t(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};!function r(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),e instanceof o.OidcClientSettings?this._settings=e:this._settings=new o.OidcClientSettings(e);}return t.prototype.createSigninRequest=function t(){var e=this,r=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},n=r.response_type,o=r.scope,s=r.redirect_uri,u=r.data,c=r.state,h=r.prompt,l=r.display,f=r.max_age,d=r.ui_locales,g=r.id_token_hint,p=r.login_hint,v=r.acr_values,y=r.resource,m=r.request,_=r.request_uri,S=r.response_mode,F=r.extraQueryParams,b=r.extraTokenParams,w=r.request_type,E=r.skipUserInfo,x=arguments[1];i.Log.debug("OidcClient.createSigninRequest");var k=this._settings.client_id;n=n||this._settings.response_type,o=o||this._settings.scope,s=s||this._settings.redirect_uri,h=h||this._settings.prompt,l=l||this._settings.display,f=f||this._settings.max_age,d=d||this._settings.ui_locales,v=v||this._settings.acr_values,y=y||this._settings.resource,S=S||this._settings.response_mode,F=F||this._settings.extraQueryParams,b=b||this._settings.extraTokenParams;var A=this._settings.authority;return a.SigninRequest.isCode(n)&&"code"!==n?Promise.reject(new Error("OpenID Connect hybrid flow is not supported")):this._metadataService.getAuthorizationEndpoint().then(function(t){i.Log.debug("OidcClient.createSigninRequest: Received authorization endpoint",t);var r=new a.SigninRequest({url:t,client_id:k,redirect_uri:s,response_type:n,scope:o,data:u||c,authority:A,prompt:h,display:l,max_age:f,ui_locales:d,id_token_hint:g,login_hint:p,acr_values:v,resource:y,request:m,request_uri:_,extraQueryParams:F,extraTokenParams:b,request_type:w,response_mode:S,client_secret:e._settings.client_secret,skipUserInfo:E}),P=r.state;return (x=x||e._stateStore).set(P.id,P.toStorageString()).then(function(){return r})})},t.prototype.readSigninResponseState=function t(e,r){var n=arguments.length>2&&void 0!==arguments[2]&&arguments[2];i.Log.debug("OidcClient.readSigninResponseState");var o="query"===this._settings.response_mode||!this._settings.response_mode&&a.SigninRequest.isCode(this._settings.response_type)?"?":"#",s=new u.SigninResponse(e,o);return s.state?(r=r||this._stateStore,(n?r.remove.bind(r):r.get.bind(r))(s.state).then(function(t){if(!t)throw i.Log.error("OidcClient.readSigninResponseState: No matching state found in storage"),new Error("No matching state found in storage");return {state:l.SigninState.fromStorageString(t),response:s}})):(i.Log.error("OidcClient.readSigninResponseState: No state in response"),Promise.reject(new Error("No state in response")))},t.prototype.processSigninResponse=function t(e,r){var n=this;return i.Log.debug("OidcClient.processSigninResponse"),this.readSigninResponseState(e,r,!0).then(function(t){var e=t.state,r=t.response;return i.Log.debug("OidcClient.processSigninResponse: Received state from storage; validating response"),n._validator.validateSigninResponse(e,r)})},t.prototype.createSignoutRequest=function t(){var e=this,r=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},n=r.id_token_hint,o=r.data,s=r.state,a=r.post_logout_redirect_uri,u=r.extraQueryParams,h=r.request_type,l=arguments[1];return i.Log.debug("OidcClient.createSignoutRequest"),a=a||this._settings.post_logout_redirect_uri,u=u||this._settings.extraQueryParams,this._metadataService.getEndSessionEndpoint().then(function(t){if(!t)throw i.Log.error("OidcClient.createSignoutRequest: No end session endpoint url returned"),new Error("no end session endpoint");i.Log.debug("OidcClient.createSignoutRequest: Received end session endpoint",t);var r=new c.SignoutRequest({url:t,id_token_hint:n,post_logout_redirect_uri:a,data:o||s,extraQueryParams:u,request_type:h}),f=r.state;return f&&(i.Log.debug("OidcClient.createSignoutRequest: Signout request has state to persist"),(l=l||e._stateStore).set(f.id,f.toStorageString())),r})},t.prototype.readSignoutResponseState=function t(e,r){var n=arguments.length>2&&void 0!==arguments[2]&&arguments[2];i.Log.debug("OidcClient.readSignoutResponseState");var o=new h.SignoutResponse(e);if(!o.state)return i.Log.debug("OidcClient.readSignoutResponseState: No state in response"),o.error?(i.Log.warn("OidcClient.readSignoutResponseState: Response was error: ",o.error),Promise.reject(new s.ErrorResponse(o))):Promise.resolve({undefined:void 0,response:o});var a=o.state;return r=r||this._stateStore,(n?r.remove.bind(r):r.get.bind(r))(a).then(function(t){if(!t)throw i.Log.error("OidcClient.readSignoutResponseState: No matching state found in storage"),new Error("No matching state found in storage");return {state:f.State.fromStorageString(t),response:o}})},t.prototype.processSignoutResponse=function t(e,r){var n=this;return i.Log.debug("OidcClient.processSignoutResponse"),this.readSignoutResponseState(e,r,!0).then(function(t){var e=t.state,r=t.response;return e?(i.Log.debug("OidcClient.processSignoutResponse: Received state from storage; validating response"),n._validator.validateSignoutResponse(e,r)):(i.Log.debug("OidcClient.processSignoutResponse: No state from storage; skipping validating response"),r)})},t.prototype.clearStaleState=function t(e){return i.Log.debug("OidcClient.clearStaleState"),e=e||this._stateStore,f.State.clearStaleState(e,this.settings.staleStateAge)},n(t,[{key:"_stateStore",get:function t(){return this.settings.stateStore}},{key:"_validator",get:function t(){return this.settings.validator}},{key:"_metadataService",get:function t(){return this.settings.metadataService}},{key:"settings",get:function t(){return this._settings}},{key:"metadataService",get:function t(){return this._metadataService}}]),t}();},function(t,e,r){Object.defineProperty(e,"__esModule",{value:!0}),e.TokenClient=void 0;var n=r(7),i=r(2),o=r(0);e.TokenClient=function(){function t(e){var r=arguments.length>1&&void 0!==arguments[1]?arguments[1]:n.JsonService,s=arguments.length>2&&void 0!==arguments[2]?arguments[2]:i.MetadataService;if(function a(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),!e)throw o.Log.error("TokenClient.ctor: No settings passed"),new Error("settings");this._settings=e,this._jsonService=new r,this._metadataService=new s(this._settings);}return t.prototype.exchangeCode=function t(){var e=this,r=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};return (r=Object.assign({},r)).grant_type=r.grant_type||"authorization_code",r.client_id=r.client_id||this._settings.client_id,r.redirect_uri=r.redirect_uri||this._settings.redirect_uri,r.code?r.redirect_uri?r.code_verifier?r.client_id?this._metadataService.getTokenEndpoint(!1).then(function(t){return o.Log.debug("TokenClient.exchangeCode: Received token endpoint"),e._jsonService.postForm(t,r).then(function(t){return o.Log.debug("TokenClient.exchangeCode: response received"),t})}):(o.Log.error("TokenClient.exchangeCode: No client_id passed"),Promise.reject(new Error("A client_id is required"))):(o.Log.error("TokenClient.exchangeCode: No code_verifier passed"),Promise.reject(new Error("A code_verifier is required"))):(o.Log.error("TokenClient.exchangeCode: No redirect_uri passed"),Promise.reject(new Error("A redirect_uri is required"))):(o.Log.error("TokenClient.exchangeCode: No code passed"),Promise.reject(new Error("A code is required")))},t.prototype.exchangeRefreshToken=function t(){var e=this,r=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};return (r=Object.assign({},r)).grant_type=r.grant_type||"refresh_token",r.client_id=r.client_id||this._settings.client_id,r.client_secret=r.client_secret||this._settings.client_secret,r.refresh_token?r.client_id?this._metadataService.getTokenEndpoint(!1).then(function(t){return o.Log.debug("TokenClient.exchangeRefreshToken: Received token endpoint"),e._jsonService.postForm(t,r).then(function(t){return o.Log.debug("TokenClient.exchangeRefreshToken: response received"),t})}):(o.Log.error("TokenClient.exchangeRefreshToken: No client_id passed"),Promise.reject(new Error("A client_id is required"))):(o.Log.error("TokenClient.exchangeRefreshToken: No refresh_token passed"),Promise.reject(new Error("A refresh_token is required")))},t}();},function(t,e,r){Object.defineProperty(e,"__esModule",{value:!0}),e.ErrorResponse=void 0;var n=r(0);e.ErrorResponse=function(t){function e(){var r=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},i=r.error,o=r.error_description,s=r.error_uri,a=r.state,u=r.session_state;if(function c(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,e),!i)throw n.Log.error("No error passed to ErrorResponse"),new Error("error");var h=function l(t,e){if(!t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return !e||"object"!=typeof e&&"function"!=typeof e?t:e}(this,t.call(this,o||i));return h.name="ErrorResponse",h.error=i,h.error_description=o,h.error_uri=s,h.state=a,h.session_state=u,h}return function r(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function, not "+typeof e);t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}}),e&&(Object.setPrototypeOf?Object.setPrototypeOf(t,e):t.__proto__=e);}(e,t),e}(Error);},function(t,e,r){Object.defineProperty(e,"__esModule",{value:!0}),e.SigninRequest=void 0;var n=r(0),i=r(3),o=r(13);e.SigninRequest=function(){function t(e){var r=e.url,s=e.client_id,a=e.redirect_uri,u=e.response_type,c=e.scope,h=e.authority,l=e.data,f=e.prompt,d=e.display,g=e.max_age,p=e.ui_locales,v=e.id_token_hint,y=e.login_hint,m=e.acr_values,_=e.resource,S=e.response_mode,F=e.request,b=e.request_uri,w=e.extraQueryParams,E=e.request_type,x=e.client_secret,k=e.extraTokenParams,A=e.skipUserInfo;if(function P(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),!r)throw n.Log.error("SigninRequest.ctor: No url passed"),new Error("url");if(!s)throw n.Log.error("SigninRequest.ctor: No client_id passed"),new Error("client_id");if(!a)throw n.Log.error("SigninRequest.ctor: No redirect_uri passed"),new Error("redirect_uri");if(!u)throw n.Log.error("SigninRequest.ctor: No response_type passed"),new Error("response_type");if(!c)throw n.Log.error("SigninRequest.ctor: No scope passed"),new Error("scope");if(!h)throw n.Log.error("SigninRequest.ctor: No authority passed"),new Error("authority");var C=t.isOidc(u),T=t.isCode(u);S||(S=t.isCode(u)?"query":null),this.state=new o.SigninState({nonce:C,data:l,client_id:s,authority:h,redirect_uri:a,code_verifier:T,request_type:E,response_mode:S,client_secret:x,scope:c,extraTokenParams:k,skipUserInfo:A}),r=i.UrlUtility.addQueryParam(r,"client_id",s),r=i.UrlUtility.addQueryParam(r,"redirect_uri",a),r=i.UrlUtility.addQueryParam(r,"response_type",u),r=i.UrlUtility.addQueryParam(r,"scope",c),r=i.UrlUtility.addQueryParam(r,"state",this.state.id),C&&(r=i.UrlUtility.addQueryParam(r,"nonce",this.state.nonce)),T&&(r=i.UrlUtility.addQueryParam(r,"code_challenge",this.state.code_challenge),r=i.UrlUtility.addQueryParam(r,"code_challenge_method","S256"));var R={prompt:f,display:d,max_age:g,ui_locales:p,id_token_hint:v,login_hint:y,acr_values:m,resource:_,request:F,request_uri:b,response_mode:S};for(var I in R)R[I]&&(r=i.UrlUtility.addQueryParam(r,I,R[I]));for(var D in w)r=i.UrlUtility.addQueryParam(r,D,w[D]);this.url=r;}return t.isOidc=function t(e){return !!e.split(/\s+/g).filter(function(t){return "id_token"===t})[0]},t.isOAuth=function t(e){return !!e.split(/\s+/g).filter(function(t){return "token"===t})[0]},t.isCode=function t(e){return !!e.split(/\s+/g).filter(function(t){return "code"===t})[0]},t}();},function(t,e,r){Object.defineProperty(e,"__esModule",{value:!0}),e.SigninState=void 0;var n=function(){function t(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n);}}return function(e,r,n){return r&&t(e.prototype,r),n&&t(e,n),e}}(),i=r(0),o=r(8),s=r(4),a=function u(t){return t&&t.__esModule?t:{default:t}}(r(14));e.SigninState=function(t){function e(){var r=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},n=r.nonce,i=r.authority,o=r.client_id,u=r.redirect_uri,c=r.code_verifier,h=r.response_mode,l=r.client_secret,f=r.scope,d=r.extraTokenParams,g=r.skipUserInfo;!function p(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,e);var v=function y(t,e){if(!t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return !e||"object"!=typeof e&&"function"!=typeof e?t:e}(this,t.call(this,arguments[0]));if(!0===n?v._nonce=(0, a.default)():n&&(v._nonce=n),!0===c?v._code_verifier=(0, a.default)()+(0, a.default)()+(0, a.default)():c&&(v._code_verifier=c),v.code_verifier){var m=s.JoseUtil.hashString(v.code_verifier,"SHA256");v._code_challenge=s.JoseUtil.hexToBase64Url(m);}return v._redirect_uri=u,v._authority=i,v._client_id=o,v._response_mode=h,v._client_secret=l,v._scope=f,v._extraTokenParams=d,v._skipUserInfo=g,v}return function r(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function, not "+typeof e);t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}}),e&&(Object.setPrototypeOf?Object.setPrototypeOf(t,e):t.__proto__=e);}(e,t),e.prototype.toStorageString=function t(){return i.Log.debug("SigninState.toStorageString"),JSON.stringify({id:this.id,data:this.data,created:this.created,request_type:this.request_type,nonce:this.nonce,code_verifier:this.code_verifier,redirect_uri:this.redirect_uri,authority:this.authority,client_id:this.client_id,response_mode:this.response_mode,client_secret:this.client_secret,scope:this.scope,extraTokenParams:this.extraTokenParams,skipUserInfo:this.skipUserInfo})},e.fromStorageString=function t(r){return i.Log.debug("SigninState.fromStorageString"),new e(JSON.parse(r))},n(e,[{key:"nonce",get:function t(){return this._nonce}},{key:"authority",get:function t(){return this._authority}},{key:"client_id",get:function t(){return this._client_id}},{key:"redirect_uri",get:function t(){return this._redirect_uri}},{key:"code_verifier",get:function t(){return this._code_verifier}},{key:"code_challenge",get:function t(){return this._code_challenge}},{key:"response_mode",get:function t(){return this._response_mode}},{key:"client_secret",get:function t(){return this._client_secret}},{key:"scope",get:function t(){return this._scope}},{key:"extraTokenParams",get:function t(){return this._extraTokenParams}},{key:"skipUserInfo",get:function t(){return this._skipUserInfo}}]),e}(o.State);},function(t,e,r){Object.defineProperty(e,"__esModule",{value:!0}),e.default=function n(){return (0, i.default)().replace(/-/g,"")};var i=function o(t){return t&&t.__esModule?t:{default:t}}(r(33));t.exports=e.default;},function(t,e,r){Object.defineProperty(e,"__esModule",{value:!0}),e.User=void 0;var n=function(){function t(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n);}}return function(e,r,n){return r&&t(e.prototype,r),n&&t(e,n),e}}(),i=r(0);e.User=function(){function t(e){var r=e.id_token,n=e.session_state,i=e.access_token,o=e.refresh_token,s=e.token_type,a=e.scope,u=e.profile,c=e.expires_at,h=e.state;!function l(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),this.id_token=r,this.session_state=n,this.access_token=i,this.refresh_token=o,this.token_type=s,this.scope=a,this.profile=u,this.expires_at=c,this.state=h;}return t.prototype.toStorageString=function t(){return i.Log.debug("User.toStorageString"),JSON.stringify({id_token:this.id_token,session_state:this.session_state,access_token:this.access_token,refresh_token:this.refresh_token,token_type:this.token_type,scope:this.scope,profile:this.profile,expires_at:this.expires_at})},t.fromStorageString=function e(r){return i.Log.debug("User.fromStorageString"),new t(JSON.parse(r))},n(t,[{key:"expires_in",get:function t(){if(this.expires_at){var e=parseInt(Date.now()/1e3);return this.expires_at-e}},set:function t(e){var r=parseInt(e);if("number"==typeof r&&r>0){var n=parseInt(Date.now()/1e3);this.expires_at=n+r;}}},{key:"expired",get:function t(){var e=this.expires_in;if(void 0!==e)return e<=0}},{key:"scopes",get:function t(){return (this.scope||"").split(" ")}}]),t}();},function(t,e,r){Object.defineProperty(e,"__esModule",{value:!0}),e.AccessTokenEvents=void 0;var n=r(0),i=r(48);var o=60;e.AccessTokenEvents=function(){function t(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},r=e.accessTokenExpiringNotificationTime,n=void 0===r?o:r,s=e.accessTokenExpiringTimer,a=void 0===s?new i.Timer("Access token expiring"):s,u=e.accessTokenExpiredTimer,c=void 0===u?new i.Timer("Access token expired"):u;!function h(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),this._accessTokenExpiringNotificationTime=n,this._accessTokenExpiring=a,this._accessTokenExpired=c;}return t.prototype.load=function t(e){if(e.access_token&&void 0!==e.expires_in){var r=e.expires_in;if(n.Log.debug("AccessTokenEvents.load: access token present, remaining duration:",r),r>0){var i=r-this._accessTokenExpiringNotificationTime;i<=0&&(i=1),n.Log.debug("AccessTokenEvents.load: registering expiring timer in:",i),this._accessTokenExpiring.init(i);}else n.Log.debug("AccessTokenEvents.load: canceling existing expiring timer becase we're past expiration."),this._accessTokenExpiring.cancel();var o=r+1;n.Log.debug("AccessTokenEvents.load: registering expired timer in:",o),this._accessTokenExpired.init(o);}else this._accessTokenExpiring.cancel(),this._accessTokenExpired.cancel();},t.prototype.unload=function t(){n.Log.debug("AccessTokenEvents.unload: canceling existing access token timers"),this._accessTokenExpiring.cancel(),this._accessTokenExpired.cancel();},t.prototype.addAccessTokenExpiring=function t(e){this._accessTokenExpiring.addHandler(e);},t.prototype.removeAccessTokenExpiring=function t(e){this._accessTokenExpiring.removeHandler(e);},t.prototype.addAccessTokenExpired=function t(e){this._accessTokenExpired.addHandler(e);},t.prototype.removeAccessTokenExpired=function t(e){this._accessTokenExpired.removeHandler(e);},t}();},function(t,e,r){Object.defineProperty(e,"__esModule",{value:!0}),e.Event=void 0;var n=r(0);e.Event=function(){function t(e){!function r(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),this._name=e,this._callbacks=[];}return t.prototype.addHandler=function t(e){this._callbacks.push(e);},t.prototype.removeHandler=function t(e){var r=this._callbacks.findIndex(function(t){return t===e});r>=0&&this._callbacks.splice(r,1);},t.prototype.raise=function t(){n.Log.debug("Event: Raising event: "+this._name);for(var e=0;e<this._callbacks.length;e++){var r;(r=this._callbacks)[e].apply(r,arguments);}},t}();},function(t,e,r){Object.defineProperty(e,"__esModule",{value:!0}),e.SessionMonitor=void 0;var n=function(){function t(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n);}}return function(e,r,n){return r&&t(e.prototype,r),n&&t(e,n),e}}(),i=r(0),o=r(19),s=r(1);e.SessionMonitor=function(){function t(e){var r=this,n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:o.CheckSessionIFrame,a=arguments.length>2&&void 0!==arguments[2]?arguments[2]:s.Global.timer;if(function u(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),!e)throw i.Log.error("SessionMonitor.ctor: No user manager passed to SessionMonitor"),new Error("userManager");this._userManager=e,this._CheckSessionIFrameCtor=n,this._timer=a,this._userManager.events.addUserLoaded(this._start.bind(this)),this._userManager.events.addUserUnloaded(this._stop.bind(this)),this._userManager.getUser().then(function(t){t?r._start(t):r._settings.monitorAnonymousSession&&r._userManager.querySessionStatus().then(function(t){var e={session_state:t.session_state};t.sub&&t.sid&&(e.profile={sub:t.sub,sid:t.sid}),r._start(e);}).catch(function(t){i.Log.error("SessionMonitor ctor: error from querySessionStatus:",t.message);});}).catch(function(t){i.Log.error("SessionMonitor ctor: error from getUser:",t.message);});}return t.prototype._start=function t(e){var r=this,n=e.session_state;n&&(e.profile?(this._sub=e.profile.sub,this._sid=e.profile.sid,i.Log.debug("SessionMonitor._start: session_state:",n,", sub:",this._sub)):(this._sub=void 0,this._sid=void 0,i.Log.debug("SessionMonitor._start: session_state:",n,", anonymous user")),this._checkSessionIFrame?this._checkSessionIFrame.start(n):this._metadataService.getCheckSessionIframe().then(function(t){if(t){i.Log.debug("SessionMonitor._start: Initializing check session iframe");var e=r._client_id,o=r._checkSessionInterval,s=r._stopCheckSessionOnError;r._checkSessionIFrame=new r._CheckSessionIFrameCtor(r._callback.bind(r),e,t,o,s),r._checkSessionIFrame.load().then(function(){r._checkSessionIFrame.start(n);});}else i.Log.warn("SessionMonitor._start: No check session iframe found in the metadata");}).catch(function(t){i.Log.error("SessionMonitor._start: Error from getCheckSessionIframe:",t.message);}));},t.prototype._stop=function t(){var e=this;if(this._sub=void 0,this._sid=void 0,this._checkSessionIFrame&&(i.Log.debug("SessionMonitor._stop"),this._checkSessionIFrame.stop()),this._settings.monitorAnonymousSession)var r=this._timer.setInterval(function(){e._timer.clearInterval(r),e._userManager.querySessionStatus().then(function(t){var r={session_state:t.session_state};t.sub&&t.sid&&(r.profile={sub:t.sub,sid:t.sid}),e._start(r);}).catch(function(t){i.Log.error("SessionMonitor: error from querySessionStatus:",t.message);});},1e3);},t.prototype._callback=function t(){var e=this;this._userManager.querySessionStatus().then(function(t){var r=!0;t?t.sub===e._sub?(r=!1,e._checkSessionIFrame.start(t.session_state),t.sid===e._sid?i.Log.debug("SessionMonitor._callback: Same sub still logged in at OP, restarting check session iframe; session_state:",t.session_state):(i.Log.debug("SessionMonitor._callback: Same sub still logged in at OP, session state has changed, restarting check session iframe; session_state:",t.session_state),e._userManager.events._raiseUserSessionChanged())):i.Log.debug("SessionMonitor._callback: Different subject signed into OP:",t.sub):i.Log.debug("SessionMonitor._callback: Subject no longer signed into OP"),r&&(e._sub?(i.Log.debug("SessionMonitor._callback: SessionMonitor._callback; raising signed out event"),e._userManager.events._raiseUserSignedOut()):(i.Log.debug("SessionMonitor._callback: SessionMonitor._callback; raising signed in event"),e._userManager.events._raiseUserSignedIn()));}).catch(function(t){e._sub&&(i.Log.debug("SessionMonitor._callback: Error calling queryCurrentSigninSession; raising signed out event",t.message),e._userManager.events._raiseUserSignedOut());});},n(t,[{key:"_settings",get:function t(){return this._userManager.settings}},{key:"_metadataService",get:function t(){return this._userManager.metadataService}},{key:"_client_id",get:function t(){return this._settings.client_id}},{key:"_checkSessionInterval",get:function t(){return this._settings.checkSessionInterval}},{key:"_stopCheckSessionOnError",get:function t(){return this._settings.stopCheckSessionOnError}}]),t}();},function(t,e,r){Object.defineProperty(e,"__esModule",{value:!0}),e.CheckSessionIFrame=void 0;var n=r(0);var i=2e3;e.CheckSessionIFrame=function(){function t(e,r,n,o){var s=!(arguments.length>4&&void 0!==arguments[4])||arguments[4];!function a(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),this._callback=e,this._client_id=r,this._url=n,this._interval=o||i,this._stopOnError=s;var u=n.indexOf("/",n.indexOf("//")+2);this._frame_origin=n.substr(0,u),this._frame=window.document.createElement("iframe"),this._frame.style.visibility="hidden",this._frame.style.position="absolute",this._frame.style.display="none",this._frame.style.width=0,this._frame.style.height=0,this._frame.src=n;}return t.prototype.load=function t(){var e=this;return new Promise(function(t){e._frame.onload=function(){t();},window.document.body.appendChild(e._frame),e._boundMessageEvent=e._message.bind(e),window.addEventListener("message",e._boundMessageEvent,!1);})},t.prototype._message=function t(e){e.origin===this._frame_origin&&e.source===this._frame.contentWindow&&("error"===e.data?(n.Log.error("CheckSessionIFrame: error message from check session op iframe"),this._stopOnError&&this.stop()):"changed"===e.data?(n.Log.debug("CheckSessionIFrame: changed message from check session op iframe"),this.stop(),this._callback()):n.Log.debug("CheckSessionIFrame: "+e.data+" message from check session op iframe"));},t.prototype.start=function t(e){var r=this;if(this._session_state!==e){n.Log.debug("CheckSessionIFrame.start"),this.stop(),this._session_state=e;var i=function t(){r._frame.contentWindow.postMessage(r._client_id+" "+r._session_state,r._frame_origin);};i(),this._timer=window.setInterval(i,this._interval);}},t.prototype.stop=function t(){this._session_state=null,this._timer&&(n.Log.debug("CheckSessionIFrame.stop"),window.clearInterval(this._timer),this._timer=null);},t}();},function(t,e,r){Object.defineProperty(e,"__esModule",{value:!0}),e.TokenRevocationClient=void 0;var n=r(0),i=r(2),o=r(1);e.TokenRevocationClient=function(){function t(e){var r=arguments.length>1&&void 0!==arguments[1]?arguments[1]:o.Global.XMLHttpRequest,s=arguments.length>2&&void 0!==arguments[2]?arguments[2]:i.MetadataService;if(function a(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),!e)throw n.Log.error("TokenRevocationClient.ctor: No settings provided"),new Error("No settings provided.");this._settings=e,this._XMLHttpRequestCtor=r,this._metadataService=new s(this._settings);}return t.prototype.revoke=function t(e,r){var i=this,o=arguments.length>2&&void 0!==arguments[2]?arguments[2]:"access_token";if(!e)throw n.Log.error("TokenRevocationClient.revoke: No token provided"),new Error("No token provided.");if("access_token"!==o&&"refresh_token"!=o)throw n.Log.error("TokenRevocationClient.revoke: Invalid token type"),new Error("Invalid token type.");return this._metadataService.getRevocationEndpoint().then(function(t){if(t){n.Log.debug("TokenRevocationClient.revoke: Revoking "+o);var s=i._settings.client_id,a=i._settings.client_secret;return i._revoke(t,s,a,e,o)}if(r)throw n.Log.error("TokenRevocationClient.revoke: Revocation not supported"),new Error("Revocation not supported")})},t.prototype._revoke=function t(e,r,i,o,s){var a=this;return new Promise(function(t,u){var c=new a._XMLHttpRequestCtor;c.open("POST",e),c.onload=function(){n.Log.debug("TokenRevocationClient.revoke: HTTP response received, status",c.status),200===c.status?t():u(Error(c.statusText+" ("+c.status+")"));},c.onerror=function(){n.Log.debug("TokenRevocationClient.revoke: Network Error."),u("Network Error");};var h="client_id="+encodeURIComponent(r);i&&(h+="&client_secret="+encodeURIComponent(i)),h+="&token_type_hint="+encodeURIComponent(s),h+="&token="+encodeURIComponent(o),c.setRequestHeader("Content-Type","application/x-www-form-urlencoded"),c.send(h);})},t}();},function(t,e,r){Object.defineProperty(e,"__esModule",{value:!0}),e.CordovaPopupWindow=void 0;var n=function(){function t(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n);}}return function(e,r,n){return r&&t(e.prototype,r),n&&t(e,n),e}}(),i=r(0);var o="location=no,toolbar=no,zoom=no",s="_blank";e.CordovaPopupWindow=function(){function t(e){var r=this;!function n(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),this._promise=new Promise(function(t,e){r._resolve=t,r._reject=e;}),this.features=e.popupWindowFeatures||o,this.target=e.popupWindowTarget||s,this.redirect_uri=e.startUrl,i.Log.debug("CordovaPopupWindow.ctor: redirect_uri: "+this.redirect_uri);}return t.prototype._isInAppBrowserInstalled=function t(e){return ["cordova-plugin-inappbrowser","cordova-plugin-inappbrowser.inappbrowser","org.apache.cordova.inappbrowser"].some(function(t){return e.hasOwnProperty(t)})},t.prototype.navigate=function t(e){if(e&&e.url){if(!window.cordova)return this._error("cordova is undefined");var r=window.cordova.require("cordova/plugin_list").metadata;if(!1===this._isInAppBrowserInstalled(r))return this._error("InAppBrowser plugin not found");this._popup=cordova.InAppBrowser.open(e.url,this.target,this.features),this._popup?(i.Log.debug("CordovaPopupWindow.navigate: popup successfully created"),this._exitCallbackEvent=this._exitCallback.bind(this),this._loadStartCallbackEvent=this._loadStartCallback.bind(this),this._popup.addEventListener("exit",this._exitCallbackEvent,!1),this._popup.addEventListener("loadstart",this._loadStartCallbackEvent,!1)):this._error("Error opening popup window");}else this._error("No url provided");return this.promise},t.prototype._loadStartCallback=function t(e){0===e.url.indexOf(this.redirect_uri)&&this._success({url:e.url});},t.prototype._exitCallback=function t(e){this._error(e);},t.prototype._success=function t(e){this._cleanup(),i.Log.debug("CordovaPopupWindow: Successful response from cordova popup window"),this._resolve(e);},t.prototype._error=function t(e){this._cleanup(),i.Log.error(e),this._reject(new Error(e));},t.prototype.close=function t(){this._cleanup();},t.prototype._cleanup=function t(){this._popup&&(i.Log.debug("CordovaPopupWindow: cleaning up popup"),this._popup.removeEventListener("exit",this._exitCallbackEvent,!1),this._popup.removeEventListener("loadstart",this._loadStartCallbackEvent,!1),this._popup.close()),this._popup=null;},n(t,[{key:"promise",get:function t(){return this._promise}}]),t}();},function(t,e,r){Object.defineProperty(e,"__esModule",{value:!0});var n=r(0),i=r(9),o=r(5),s=r(6),a=r(39),u=r(40),c=r(16),h=r(2),l=r(50),f=r(51),d=r(19),g=r(20),p=r(18),v=r(1),y=r(15),m=r(52);e.default={Version:m.Version,Log:n.Log,OidcClient:i.OidcClient,OidcClientSettings:o.OidcClientSettings,WebStorageStateStore:s.WebStorageStateStore,InMemoryWebStorage:a.InMemoryWebStorage,UserManager:u.UserManager,AccessTokenEvents:c.AccessTokenEvents,MetadataService:h.MetadataService,CordovaPopupNavigator:l.CordovaPopupNavigator,CordovaIFrameNavigator:f.CordovaIFrameNavigator,CheckSessionIFrame:d.CheckSessionIFrame,TokenRevocationClient:g.TokenRevocationClient,SessionMonitor:p.SessionMonitor,Global:v.Global,User:y.User},t.exports=e.default;},function(t,e,r){Object.defineProperty(e,"__esModule",{value:!0}),e.ResponseValidator=void 0;var n="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},i=r(0),o=r(2),s=r(24),a=r(10),u=r(11),c=r(4);var h=["nonce","at_hash","iat","nbf","exp","aud","iss","c_hash"];e.ResponseValidator=function(){function t(e){var r=arguments.length>1&&void 0!==arguments[1]?arguments[1]:o.MetadataService,n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:s.UserInfoService,u=arguments.length>3&&void 0!==arguments[3]?arguments[3]:c.JoseUtil,h=arguments.length>4&&void 0!==arguments[4]?arguments[4]:a.TokenClient;if(function l(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),!e)throw i.Log.error("ResponseValidator.ctor: No settings passed to ResponseValidator"),new Error("settings");this._settings=e,this._metadataService=new r(this._settings),this._userInfoService=new n(this._settings),this._joseUtil=u,this._tokenClient=new h(this._settings);}return t.prototype.validateSigninResponse=function t(e,r){var n=this;return i.Log.debug("ResponseValidator.validateSigninResponse"),this._processSigninParams(e,r).then(function(t){return i.Log.debug("ResponseValidator.validateSigninResponse: state processed"),n._validateTokens(e,t).then(function(t){return i.Log.debug("ResponseValidator.validateSigninResponse: tokens validated"),n._processClaims(e,t).then(function(t){return i.Log.debug("ResponseValidator.validateSigninResponse: claims processed"),t})})})},t.prototype.validateSignoutResponse=function t(e,r){return e.id!==r.state?(i.Log.error("ResponseValidator.validateSignoutResponse: State does not match"),Promise.reject(new Error("State does not match"))):(i.Log.debug("ResponseValidator.validateSignoutResponse: state validated"),r.state=e.data,r.error?(i.Log.warn("ResponseValidator.validateSignoutResponse: Response was error",r.error),Promise.reject(new u.ErrorResponse(r))):Promise.resolve(r))},t.prototype._processSigninParams=function t(e,r){if(e.id!==r.state)return i.Log.error("ResponseValidator._processSigninParams: State does not match"),Promise.reject(new Error("State does not match"));if(!e.client_id)return i.Log.error("ResponseValidator._processSigninParams: No client_id on state"),Promise.reject(new Error("No client_id on state"));if(!e.authority)return i.Log.error("ResponseValidator._processSigninParams: No authority on state"),Promise.reject(new Error("No authority on state"));if(this._settings.authority){if(this._settings.authority&&this._settings.authority!==e.authority)return i.Log.error("ResponseValidator._processSigninParams: authority mismatch on settings vs. signin state"),Promise.reject(new Error("authority mismatch on settings vs. signin state"))}else this._settings.authority=e.authority;if(this._settings.client_id){if(this._settings.client_id&&this._settings.client_id!==e.client_id)return i.Log.error("ResponseValidator._processSigninParams: client_id mismatch on settings vs. signin state"),Promise.reject(new Error("client_id mismatch on settings vs. signin state"))}else this._settings.client_id=e.client_id;return i.Log.debug("ResponseValidator._processSigninParams: state validated"),r.state=e.data,r.error?(i.Log.warn("ResponseValidator._processSigninParams: Response was error",r.error),Promise.reject(new u.ErrorResponse(r))):e.nonce&&!r.id_token?(i.Log.error("ResponseValidator._processSigninParams: Expecting id_token in response"),Promise.reject(new Error("No id_token in response"))):!e.nonce&&r.id_token?(i.Log.error("ResponseValidator._processSigninParams: Not expecting id_token in response"),Promise.reject(new Error("Unexpected id_token in response"))):e.code_verifier&&!r.code?(i.Log.error("ResponseValidator._processSigninParams: Expecting code in response"),Promise.reject(new Error("No code in response"))):!e.code_verifier&&r.code?(i.Log.error("ResponseValidator._processSigninParams: Not expecting code in response"),Promise.reject(new Error("Unexpected code in response"))):(r.scope||(r.scope=e.scope),Promise.resolve(r))},t.prototype._processClaims=function t(e,r){var n=this;if(r.isOpenIdConnect){if(i.Log.debug("ResponseValidator._processClaims: response is OIDC, processing claims"),r.profile=this._filterProtocolClaims(r.profile),!0!==e.skipUserInfo&&this._settings.loadUserInfo&&r.access_token)return i.Log.debug("ResponseValidator._processClaims: loading user info"),this._userInfoService.getClaims(r.access_token).then(function(t){return i.Log.debug("ResponseValidator._processClaims: user info claims received from user info endpoint"),t.sub!==r.profile.sub?(i.Log.error("ResponseValidator._processClaims: sub from user info endpoint does not match sub in access_token"),Promise.reject(new Error("sub from user info endpoint does not match sub in access_token"))):(r.profile=n._mergeClaims(r.profile,t),i.Log.debug("ResponseValidator._processClaims: user info claims received, updated profile:",r.profile),r)});i.Log.debug("ResponseValidator._processClaims: not loading user info");}else i.Log.debug("ResponseValidator._processClaims: response is not OIDC, not processing claims");return Promise.resolve(r)},t.prototype._mergeClaims=function t(e,r){var i=Object.assign({},e);for(var o in r){var s=r[o];Array.isArray(s)||(s=[s]);for(var a=0;a<s.length;a++){var u=s[a];i[o]?Array.isArray(i[o])?i[o].indexOf(u)<0&&i[o].push(u):i[o]!==u&&("object"===(void 0===u?"undefined":n(u))?i[o]=this._mergeClaims(i[o],u):i[o]=[i[o],u]):i[o]=u;}}return i},t.prototype._filterProtocolClaims=function t(e){i.Log.debug("ResponseValidator._filterProtocolClaims, incoming claims:",e);var r=Object.assign({},e);return this._settings._filterProtocolClaims?(h.forEach(function(t){delete r[t];}),i.Log.debug("ResponseValidator._filterProtocolClaims: protocol claims filtered",r)):i.Log.debug("ResponseValidator._filterProtocolClaims: protocol claims not filtered"),r},t.prototype._validateTokens=function t(e,r){return r.code?(i.Log.debug("ResponseValidator._validateTokens: Validating code"),this._processCode(e,r)):r.id_token?r.access_token?(i.Log.debug("ResponseValidator._validateTokens: Validating id_token and access_token"),this._validateIdTokenAndAccessToken(e,r)):(i.Log.debug("ResponseValidator._validateTokens: Validating id_token"),this._validateIdToken(e,r)):(i.Log.debug("ResponseValidator._validateTokens: No code to process or id_token to validate"),Promise.resolve(r))},t.prototype._processCode=function t(e,r){var o=this,s={client_id:e.client_id,client_secret:e.client_secret,code:r.code,redirect_uri:e.redirect_uri,code_verifier:e.code_verifier};return e.extraTokenParams&&"object"===n(e.extraTokenParams)&&Object.assign(s,e.extraTokenParams),this._tokenClient.exchangeCode(s).then(function(t){for(var n in t)r[n]=t[n];return r.id_token?(i.Log.debug("ResponseValidator._processCode: token response successful, processing id_token"),o._validateIdTokenAttributes(e,r)):(i.Log.debug("ResponseValidator._processCode: token response successful, returning response"),r)})},t.prototype._validateIdTokenAttributes=function t(e,r){var n=this;return this._metadataService.getIssuer().then(function(t){var o=e.client_id,s=n._settings.clockSkew;return i.Log.debug("ResponseValidator._validateIdTokenAttributes: Validaing JWT attributes; using clock skew (in seconds) of: ",s),n._joseUtil.validateJwtAttributes(r.id_token,t,o,s).then(function(t){return e.nonce&&e.nonce!==t.nonce?(i.Log.error("ResponseValidator._validateIdTokenAttributes: Invalid nonce in id_token"),Promise.reject(new Error("Invalid nonce in id_token"))):t.sub?(r.profile=t,r):(i.Log.error("ResponseValidator._validateIdTokenAttributes: No sub present in id_token"),Promise.reject(new Error("No sub present in id_token")))})})},t.prototype._validateIdTokenAndAccessToken=function t(e,r){var n=this;return this._validateIdToken(e,r).then(function(t){return n._validateAccessToken(t)})},t.prototype._validateIdToken=function t(e,r){var n=this;if(!e.nonce)return i.Log.error("ResponseValidator._validateIdToken: No nonce on state"),Promise.reject(new Error("No nonce on state"));var o=this._joseUtil.parseJwt(r.id_token);if(!o||!o.header||!o.payload)return i.Log.error("ResponseValidator._validateIdToken: Failed to parse id_token",o),Promise.reject(new Error("Failed to parse id_token"));if(e.nonce!==o.payload.nonce)return i.Log.error("ResponseValidator._validateIdToken: Invalid nonce in id_token"),Promise.reject(new Error("Invalid nonce in id_token"));var s=o.header.kid;return this._metadataService.getIssuer().then(function(t){return i.Log.debug("ResponseValidator._validateIdToken: Received issuer"),n._metadataService.getSigningKeys().then(function(a){if(!a)return i.Log.error("ResponseValidator._validateIdToken: No signing keys from metadata"),Promise.reject(new Error("No signing keys from metadata"));i.Log.debug("ResponseValidator._validateIdToken: Received signing keys");var u=void 0;if(s)u=a.filter(function(t){return t.kid===s})[0];else {if((a=n._filterByAlg(a,o.header.alg)).length>1)return i.Log.error("ResponseValidator._validateIdToken: No kid found in id_token and more than one key found in metadata"),Promise.reject(new Error("No kid found in id_token and more than one key found in metadata"));u=a[0];}if(!u)return i.Log.error("ResponseValidator._validateIdToken: No key matching kid or alg found in signing keys"),Promise.reject(new Error("No key matching kid or alg found in signing keys"));var c=e.client_id,h=n._settings.clockSkew;return i.Log.debug("ResponseValidator._validateIdToken: Validaing JWT; using clock skew (in seconds) of: ",h),n._joseUtil.validateJwt(r.id_token,u,t,c,h).then(function(){return i.Log.debug("ResponseValidator._validateIdToken: JWT validation successful"),o.payload.sub?(r.profile=o.payload,r):(i.Log.error("ResponseValidator._validateIdToken: No sub present in id_token"),Promise.reject(new Error("No sub present in id_token")))})})})},t.prototype._filterByAlg=function t(e,r){var n=null;if(r.startsWith("RS"))n="RSA";else if(r.startsWith("PS"))n="PS";else {if(!r.startsWith("ES"))return i.Log.debug("ResponseValidator._filterByAlg: alg not supported: ",r),[];n="EC";}return i.Log.debug("ResponseValidator._filterByAlg: Looking for keys that match kty: ",n),e=e.filter(function(t){return t.kty===n}),i.Log.debug("ResponseValidator._filterByAlg: Number of keys that match kty: ",n,e.length),e},t.prototype._validateAccessToken=function t(e){if(!e.profile)return i.Log.error("ResponseValidator._validateAccessToken: No profile loaded from id_token"),Promise.reject(new Error("No profile loaded from id_token"));if(!e.profile.at_hash)return i.Log.error("ResponseValidator._validateAccessToken: No at_hash in id_token"),Promise.reject(new Error("No at_hash in id_token"));if(!e.id_token)return i.Log.error("ResponseValidator._validateAccessToken: No id_token"),Promise.reject(new Error("No id_token"));var r=this._joseUtil.parseJwt(e.id_token);if(!r||!r.header)return i.Log.error("ResponseValidator._validateAccessToken: Failed to parse id_token",r),Promise.reject(new Error("Failed to parse id_token"));var n=r.header.alg;if(!n||5!==n.length)return i.Log.error("ResponseValidator._validateAccessToken: Unsupported alg:",n),Promise.reject(new Error("Unsupported alg: "+n));var o=n.substr(2,3);if(!o)return i.Log.error("ResponseValidator._validateAccessToken: Unsupported alg:",n,o),Promise.reject(new Error("Unsupported alg: "+n));if(256!==(o=parseInt(o))&&384!==o&&512!==o)return i.Log.error("ResponseValidator._validateAccessToken: Unsupported alg:",n,o),Promise.reject(new Error("Unsupported alg: "+n));var s="sha"+o,a=this._joseUtil.hashString(e.access_token,s);if(!a)return i.Log.error("ResponseValidator._validateAccessToken: access_token hash failed:",s),Promise.reject(new Error("Failed to validate at_hash"));var u=a.substr(0,a.length/2),c=this._joseUtil.hexToBase64Url(u);return c!==e.profile.at_hash?(i.Log.error("ResponseValidator._validateAccessToken: Failed to validate at_hash",c,e.profile.at_hash),Promise.reject(new Error("Failed to validate at_hash"))):(i.Log.debug("ResponseValidator._validateAccessToken: success"),Promise.resolve(e))},t}();},function(t,e,r){Object.defineProperty(e,"__esModule",{value:!0}),e.UserInfoService=void 0;var n=r(7),i=r(2),o=r(0),s=r(4);e.UserInfoService=function(){function t(e){var r=arguments.length>1&&void 0!==arguments[1]?arguments[1]:n.JsonService,a=arguments.length>2&&void 0!==arguments[2]?arguments[2]:i.MetadataService,u=arguments.length>3&&void 0!==arguments[3]?arguments[3]:s.JoseUtil;if(function c(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),!e)throw o.Log.error("UserInfoService.ctor: No settings passed"),new Error("settings");this._settings=e,this._jsonService=new r(void 0,void 0,this._getClaimsFromJwt.bind(this)),this._metadataService=new a(this._settings),this._joseUtil=u;}return t.prototype.getClaims=function t(e){var r=this;return e?this._metadataService.getUserInfoEndpoint().then(function(t){return o.Log.debug("UserInfoService.getClaims: received userinfo url",t),r._jsonService.getJson(t,e).then(function(t){return o.Log.debug("UserInfoService.getClaims: claims received",t),t})}):(o.Log.error("UserInfoService.getClaims: No token passed"),Promise.reject(new Error("A token is required")))},t.prototype._getClaimsFromJwt=function t(e){var r=this;try{var n=this._joseUtil.parseJwt(e.responseText);if(!n||!n.header||!n.payload)return o.Log.error("UserInfoService._getClaimsFromJwt: Failed to parse JWT",n),Promise.reject(new Error("Failed to parse id_token"));var i=n.header.kid,s=void 0;switch(this._settings.userInfoJwtIssuer){case"OP":s=this._metadataService.getIssuer();break;case"ANY":s=Promise.resolve(n.payload.iss);break;default:s=Promise.resolve(this._settings.userInfoJwtIssuer);}return s.then(function(t){return o.Log.debug("UserInfoService._getClaimsFromJwt: Received issuer:"+t),r._metadataService.getSigningKeys().then(function(s){if(!s)return o.Log.error("UserInfoService._getClaimsFromJwt: No signing keys from metadata"),Promise.reject(new Error("No signing keys from metadata"));o.Log.debug("UserInfoService._getClaimsFromJwt: Received signing keys");var a=void 0;if(i)a=s.filter(function(t){return t.kid===i})[0];else {if((s=r._filterByAlg(s,n.header.alg)).length>1)return o.Log.error("UserInfoService._getClaimsFromJwt: No kid found in id_token and more than one key found in metadata"),Promise.reject(new Error("No kid found in id_token and more than one key found in metadata"));a=s[0];}if(!a)return o.Log.error("UserInfoService._getClaimsFromJwt: No key matching kid or alg found in signing keys"),Promise.reject(new Error("No key matching kid or alg found in signing keys"));var u=r._settings.client_id,c=r._settings.clockSkew;return o.Log.debug("UserInfoService._getClaimsFromJwt: Validaing JWT; using clock skew (in seconds) of: ",c),r._joseUtil.validateJwt(e.responseText,a,t,u,c,void 0,!0).then(function(){return o.Log.debug("UserInfoService._getClaimsFromJwt: JWT validation successful"),n.payload})})})}catch(t){return o.Log.error("UserInfoService._getClaimsFromJwt: Error parsing JWT response",t.message),void reject(t)}},t.prototype._filterByAlg=function t(e,r){var n=null;if(r.startsWith("RS"))n="RSA";else if(r.startsWith("PS"))n="PS";else {if(!r.startsWith("ES"))return o.Log.debug("UserInfoService._filterByAlg: alg not supported: ",r),[];n="EC";}return o.Log.debug("UserInfoService._filterByAlg: Looking for keys that match kty: ",n),e=e.filter(function(t){return t.kty===n}),o.Log.debug("UserInfoService._filterByAlg: Number of keys that match kty: ",n,e.length),e},t}();},function(t,e,r){Object.defineProperty(e,"__esModule",{value:!0}),e.AllowedSigningAlgs=e.b64tohex=e.hextob64u=e.crypto=e.X509=e.KeyUtil=e.jws=void 0;var n=r(26);e.jws=n.jws,e.KeyUtil=n.KEYUTIL,e.X509=n.X509,e.crypto=n.crypto,e.hextob64u=n.hextob64u,e.b64tohex=n.b64tohex,e.AllowedSigningAlgs=["RS256","RS384","RS512","PS256","PS384","PS512","ES256","ES384","ES512"];},function(t,e,r){(function(t){Object.defineProperty(e,"__esModule",{value:!0});var r="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},n={userAgent:!1},i={};
    /*!
    Copyright (c) 2011, Yahoo! Inc. All rights reserved.
    Code licensed under the BSD License:
    http://developer.yahoo.com/yui/license.html
    version: 2.9.0
    */
    if(void 0===o)var o={};o.lang={extend:function t(e,r,i){if(!r||!e)throw new Error("YAHOO.lang.extend failed, please check that all dependencies are included.");var o=function t(){};if(o.prototype=r.prototype,e.prototype=new o,e.prototype.constructor=e,e.superclass=r.prototype,r.prototype.constructor==Object.prototype.constructor&&(r.prototype.constructor=r),i){var s;for(s in i)e.prototype[s]=i[s];var a=function t(){},u=["toString","valueOf"];try{/MSIE/.test(n.userAgent)&&(a=function t(e,r){for(s=0;s<u.length;s+=1){var n=u[s],i=r[n];"function"==typeof i&&i!=Object.prototype[n]&&(e[n]=i);}});}catch(t){}a(e.prototype,i);}}};
    /*! CryptoJS v3.1.2 core-fix.js
     * code.google.com/p/crypto-js
     * (c) 2009-2013 by Jeff Mott. All rights reserved.
     * code.google.com/p/crypto-js/wiki/License
     * THIS IS FIX of 'core.js' to fix Hmac issue.
     * https://code.google.com/p/crypto-js/issues/detail?id=84
     * https://crypto-js.googlecode.com/svn-history/r667/branches/3.x/src/core.js
     */
    var s,a,u,c,h,l,f,d,g,p,v,y=y||(s=Math,u=(a={}).lib={},c=u.Base=function(){function t(){}return {extend:function e(r){t.prototype=this;var n=new t;return r&&n.mixIn(r),n.hasOwnProperty("init")||(n.init=function(){n.$super.init.apply(this,arguments);}),n.init.prototype=n,n.$super=this,n},create:function t(){var e=this.extend();return e.init.apply(e,arguments),e},init:function t(){},mixIn:function t(e){for(var r in e)e.hasOwnProperty(r)&&(this[r]=e[r]);e.hasOwnProperty("toString")&&(this.toString=e.toString);},clone:function t(){return this.init.prototype.extend(this)}}}(),h=u.WordArray=c.extend({init:function t(e,r){e=this.words=e||[],this.sigBytes=void 0!=r?r:4*e.length;},toString:function t(e){return (e||f).stringify(this)},concat:function t(e){var r=this.words,n=e.words,i=this.sigBytes,o=e.sigBytes;if(this.clamp(),i%4)for(var s=0;s<o;s++){var a=n[s>>>2]>>>24-s%4*8&255;r[i+s>>>2]|=a<<24-(i+s)%4*8;}else for(s=0;s<o;s+=4)r[i+s>>>2]=n[s>>>2];return this.sigBytes+=o,this},clamp:function t(){var e=this.words,r=this.sigBytes;e[r>>>2]&=4294967295<<32-r%4*8,e.length=s.ceil(r/4);},clone:function t(){var e=c.clone.call(this);return e.words=this.words.slice(0),e},random:function t(e){for(var r=[],n=0;n<e;n+=4)r.push(4294967296*s.random()|0);return new h.init(r,e)}}),l=a.enc={},f=l.Hex={stringify:function t(e){for(var r=e.words,n=e.sigBytes,i=[],o=0;o<n;o++){var s=r[o>>>2]>>>24-o%4*8&255;i.push((s>>>4).toString(16)),i.push((15&s).toString(16));}return i.join("")},parse:function t(e){for(var r=e.length,n=[],i=0;i<r;i+=2)n[i>>>3]|=parseInt(e.substr(i,2),16)<<24-i%8*4;return new h.init(n,r/2)}},d=l.Latin1={stringify:function t(e){for(var r=e.words,n=e.sigBytes,i=[],o=0;o<n;o++){var s=r[o>>>2]>>>24-o%4*8&255;i.push(String.fromCharCode(s));}return i.join("")},parse:function t(e){for(var r=e.length,n=[],i=0;i<r;i++)n[i>>>2]|=(255&e.charCodeAt(i))<<24-i%4*8;return new h.init(n,r)}},g=l.Utf8={stringify:function t(e){try{return decodeURIComponent(escape(d.stringify(e)))}catch(t){throw new Error("Malformed UTF-8 data")}},parse:function t(e){return d.parse(unescape(encodeURIComponent(e)))}},p=u.BufferedBlockAlgorithm=c.extend({reset:function t(){this._data=new h.init,this._nDataBytes=0;},_append:function t(e){"string"==typeof e&&(e=g.parse(e)),this._data.concat(e),this._nDataBytes+=e.sigBytes;},_process:function t(e){var r=this._data,n=r.words,i=r.sigBytes,o=this.blockSize,a=i/(4*o),u=(a=e?s.ceil(a):s.max((0|a)-this._minBufferSize,0))*o,c=s.min(4*u,i);if(u){for(var l=0;l<u;l+=o)this._doProcessBlock(n,l);var f=n.splice(0,u);r.sigBytes-=c;}return new h.init(f,c)},clone:function t(){var e=c.clone.call(this);return e._data=this._data.clone(),e},_minBufferSize:0}),u.Hasher=p.extend({cfg:c.extend(),init:function t(e){this.cfg=this.cfg.extend(e),this.reset();},reset:function t(){p.reset.call(this),this._doReset();},update:function t(e){return this._append(e),this._process(),this},finalize:function t(e){return e&&this._append(e),this._doFinalize()},blockSize:16,_createHelper:function t(e){return function(t,r){return new e.init(r).finalize(t)}},_createHmacHelper:function t(e){return function(t,r){return new v.HMAC.init(e,r).finalize(t)}}}),v=a.algo={},a);!function(t){var e,r=(e=y).lib,n=r.Base,i=r.WordArray;(e=e.x64={}).Word=n.extend({init:function t(e,r){this.high=e,this.low=r;}}),e.WordArray=n.extend({init:function t(e,r){e=this.words=e||[],this.sigBytes=void 0!=r?r:8*e.length;},toX32:function t(){for(var e=this.words,r=e.length,n=[],o=0;o<r;o++){var s=e[o];n.push(s.high),n.push(s.low);}return i.create(n,this.sigBytes)},clone:function t(){for(var e=n.clone.call(this),r=e.words=this.words.slice(0),i=r.length,o=0;o<i;o++)r[o]=r[o].clone();return e}});}(),function(){var t=y,e=t.lib.WordArray;t.enc.Base64={stringify:function t(e){var r=e.words,n=e.sigBytes,i=this._map;e.clamp(),e=[];for(var o=0;o<n;o+=3)for(var s=(r[o>>>2]>>>24-o%4*8&255)<<16|(r[o+1>>>2]>>>24-(o+1)%4*8&255)<<8|r[o+2>>>2]>>>24-(o+2)%4*8&255,a=0;4>a&&o+.75*a<n;a++)e.push(i.charAt(s>>>6*(3-a)&63));if(r=i.charAt(64))for(;e.length%4;)e.push(r);return e.join("")},parse:function t(r){var n=r.length,i=this._map;(o=i.charAt(64))&&(-1!=(o=r.indexOf(o))&&(n=o));for(var o=[],s=0,a=0;a<n;a++)if(a%4){var u=i.indexOf(r.charAt(a-1))<<a%4*2,c=i.indexOf(r.charAt(a))>>>6-a%4*2;o[s>>>2]|=(u|c)<<24-s%4*8,s++;}return e.create(o,s)},_map:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="};}(),function(t){for(var e=y,r=(i=e.lib).WordArray,n=i.Hasher,i=e.algo,o=[],s=[],a=function t(e){return 4294967296*(e-(0|e))|0},u=2,c=0;64>c;){var h;t:{h=u;for(var l=t.sqrt(h),f=2;f<=l;f++)if(!(h%f)){h=!1;break t}h=!0;}h&&(8>c&&(o[c]=a(t.pow(u,.5))),s[c]=a(t.pow(u,1/3)),c++),u++;}var d=[];i=i.SHA256=n.extend({_doReset:function t(){this._hash=new r.init(o.slice(0));},_doProcessBlock:function t(e,r){for(var n=this._hash.words,i=n[0],o=n[1],a=n[2],u=n[3],c=n[4],h=n[5],l=n[6],f=n[7],g=0;64>g;g++){if(16>g)d[g]=0|e[r+g];else {var p=d[g-15],v=d[g-2];d[g]=((p<<25|p>>>7)^(p<<14|p>>>18)^p>>>3)+d[g-7]+((v<<15|v>>>17)^(v<<13|v>>>19)^v>>>10)+d[g-16];}p=f+((c<<26|c>>>6)^(c<<21|c>>>11)^(c<<7|c>>>25))+(c&h^~c&l)+s[g]+d[g],v=((i<<30|i>>>2)^(i<<19|i>>>13)^(i<<10|i>>>22))+(i&o^i&a^o&a),f=l,l=h,h=c,c=u+p|0,u=a,a=o,o=i,i=p+v|0;}n[0]=n[0]+i|0,n[1]=n[1]+o|0,n[2]=n[2]+a|0,n[3]=n[3]+u|0,n[4]=n[4]+c|0,n[5]=n[5]+h|0,n[6]=n[6]+l|0,n[7]=n[7]+f|0;},_doFinalize:function e(){var r=this._data,n=r.words,i=8*this._nDataBytes,o=8*r.sigBytes;return n[o>>>5]|=128<<24-o%32,n[14+(o+64>>>9<<4)]=t.floor(i/4294967296),n[15+(o+64>>>9<<4)]=i,r.sigBytes=4*n.length,this._process(),this._hash},clone:function t(){var e=n.clone.call(this);return e._hash=this._hash.clone(),e}});e.SHA256=n._createHelper(i),e.HmacSHA256=n._createHmacHelper(i);}(Math),function(){function t(){return n.create.apply(n,arguments)}for(var e=y,r=e.lib.Hasher,n=(o=e.x64).Word,i=o.WordArray,o=e.algo,s=[t(1116352408,3609767458),t(1899447441,602891725),t(3049323471,3964484399),t(3921009573,2173295548),t(961987163,4081628472),t(1508970993,3053834265),t(2453635748,2937671579),t(2870763221,3664609560),t(3624381080,2734883394),t(310598401,1164996542),t(607225278,1323610764),t(1426881987,3590304994),t(1925078388,4068182383),t(2162078206,991336113),t(2614888103,633803317),t(3248222580,3479774868),t(3835390401,2666613458),t(4022224774,944711139),t(264347078,2341262773),t(604807628,2007800933),t(770255983,1495990901),t(1249150122,1856431235),t(1555081692,3175218132),t(1996064986,2198950837),t(2554220882,3999719339),t(2821834349,766784016),t(2952996808,2566594879),t(3210313671,3203337956),t(3336571891,1034457026),t(3584528711,2466948901),t(113926993,3758326383),t(338241895,168717936),t(666307205,1188179964),t(773529912,1546045734),t(1294757372,1522805485),t(1396182291,2643833823),t(1695183700,2343527390),t(1986661051,1014477480),t(2177026350,1206759142),t(2456956037,344077627),t(2730485921,1290863460),t(2820302411,3158454273),t(3259730800,3505952657),t(3345764771,106217008),t(3516065817,3606008344),t(3600352804,1432725776),t(4094571909,1467031594),t(275423344,851169720),t(430227734,3100823752),t(506948616,1363258195),t(659060556,3750685593),t(883997877,3785050280),t(958139571,3318307427),t(1322822218,3812723403),t(1537002063,2003034995),t(1747873779,3602036899),t(1955562222,1575990012),t(2024104815,1125592928),t(2227730452,2716904306),t(2361852424,442776044),t(2428436474,593698344),t(2756734187,3733110249),t(3204031479,2999351573),t(3329325298,3815920427),t(3391569614,3928383900),t(3515267271,566280711),t(3940187606,3454069534),t(4118630271,4000239992),t(116418474,1914138554),t(174292421,2731055270),t(289380356,3203993006),t(460393269,320620315),t(685471733,587496836),t(852142971,1086792851),t(1017036298,365543100),t(1126000580,2618297676),t(1288033470,3409855158),t(1501505948,4234509866),t(1607167915,987167468),t(1816402316,1246189591)],a=[],u=0;80>u;u++)a[u]=t();o=o.SHA512=r.extend({_doReset:function t(){this._hash=new i.init([new n.init(1779033703,4089235720),new n.init(3144134277,2227873595),new n.init(1013904242,4271175723),new n.init(2773480762,1595750129),new n.init(1359893119,2917565137),new n.init(2600822924,725511199),new n.init(528734635,4215389547),new n.init(1541459225,327033209)]);},_doProcessBlock:function t(e,r){for(var n=(f=this._hash.words)[0],i=f[1],o=f[2],u=f[3],c=f[4],h=f[5],l=f[6],f=f[7],d=n.high,g=n.low,p=i.high,v=i.low,y=o.high,m=o.low,_=u.high,S=u.low,F=c.high,b=c.low,w=h.high,E=h.low,x=l.high,k=l.low,A=f.high,P=f.low,C=d,T=g,R=p,I=v,D=y,U=m,L=_,B=S,N=F,O=b,j=w,H=E,M=x,K=k,V=A,q=P,J=0;80>J;J++){var W=a[J];if(16>J)var z=W.high=0|e[r+2*J],Y=W.low=0|e[r+2*J+1];else {z=((Y=(z=a[J-15]).high)>>>1|(G=z.low)<<31)^(Y>>>8|G<<24)^Y>>>7;var G=(G>>>1|Y<<31)^(G>>>8|Y<<24)^(G>>>7|Y<<25),X=((Y=(X=a[J-2]).high)>>>19|(Q=X.low)<<13)^(Y<<3|Q>>>29)^Y>>>6,Q=(Q>>>19|Y<<13)^(Q<<3|Y>>>29)^(Q>>>6|Y<<26),$=(Y=a[J-7]).high,Z=(tt=a[J-16]).high,tt=tt.low;z=(z=(z=z+$+((Y=G+Y.low)>>>0<G>>>0?1:0))+X+((Y=Y+Q)>>>0<Q>>>0?1:0))+Z+((Y=Y+tt)>>>0<tt>>>0?1:0);W.high=z,W.low=Y;}$=N&j^~N&M,tt=O&H^~O&K,W=C&R^C&D^R&D;var et=T&I^T&U^I&U,rt=(G=(C>>>28|T<<4)^(C<<30|T>>>2)^(C<<25|T>>>7),X=(T>>>28|C<<4)^(T<<30|C>>>2)^(T<<25|C>>>7),(Q=s[J]).high),nt=Q.low;Z=(Z=(Z=(Z=V+((N>>>14|O<<18)^(N>>>18|O<<14)^(N<<23|O>>>9))+((Q=q+((O>>>14|N<<18)^(O>>>18|N<<14)^(O<<23|N>>>9)))>>>0<q>>>0?1:0))+$+((Q=Q+tt)>>>0<tt>>>0?1:0))+rt+((Q=Q+nt)>>>0<nt>>>0?1:0))+z+((Q=Q+Y)>>>0<Y>>>0?1:0),W=G+W+((Y=X+et)>>>0<X>>>0?1:0),V=M,q=K,M=j,K=H,j=N,H=O,N=L+Z+((O=B+Q|0)>>>0<B>>>0?1:0)|0,L=D,B=U,D=R,U=I,R=C,I=T,C=Z+W+((T=Q+Y|0)>>>0<Q>>>0?1:0)|0;}g=n.low=g+T,n.high=d+C+(g>>>0<T>>>0?1:0),v=i.low=v+I,i.high=p+R+(v>>>0<I>>>0?1:0),m=o.low=m+U,o.high=y+D+(m>>>0<U>>>0?1:0),S=u.low=S+B,u.high=_+L+(S>>>0<B>>>0?1:0),b=c.low=b+O,c.high=F+N+(b>>>0<O>>>0?1:0),E=h.low=E+H,h.high=w+j+(E>>>0<H>>>0?1:0),k=l.low=k+K,l.high=x+M+(k>>>0<K>>>0?1:0),P=f.low=P+q,f.high=A+V+(P>>>0<q>>>0?1:0);},_doFinalize:function t(){var e=this._data,r=e.words,n=8*this._nDataBytes,i=8*e.sigBytes;return r[i>>>5]|=128<<24-i%32,r[30+(i+128>>>10<<5)]=Math.floor(n/4294967296),r[31+(i+128>>>10<<5)]=n,e.sigBytes=4*r.length,this._process(),this._hash.toX32()},clone:function t(){var e=r.clone.call(this);return e._hash=this._hash.clone(),e},blockSize:32}),e.SHA512=r._createHelper(o),e.HmacSHA512=r._createHmacHelper(o);}(),function(){var t=y,e=(i=t.x64).Word,r=i.WordArray,n=(i=t.algo).SHA512,i=i.SHA384=n.extend({_doReset:function t(){this._hash=new r.init([new e.init(3418070365,3238371032),new e.init(1654270250,914150663),new e.init(2438529370,812702999),new e.init(355462360,4144912697),new e.init(1731405415,4290775857),new e.init(2394180231,1750603025),new e.init(3675008525,1694076839),new e.init(1203062813,3204075428)]);},_doFinalize:function t(){var e=n._doFinalize.call(this);return e.sigBytes-=16,e}});t.SHA384=n._createHelper(i),t.HmacSHA384=n._createHmacHelper(i);}();
    /*! (c) Tom Wu | http://www-cs-students.stanford.edu/~tjw/jsbn/
     */
    var m,_="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",S="=";function F(t){var e,r,n="";for(e=0;e+3<=t.length;e+=3)r=parseInt(t.substring(e,e+3),16),n+=_.charAt(r>>6)+_.charAt(63&r);if(e+1==t.length?(r=parseInt(t.substring(e,e+1),16),n+=_.charAt(r<<2)):e+2==t.length&&(r=parseInt(t.substring(e,e+2),16),n+=_.charAt(r>>2)+_.charAt((3&r)<<4)),S)for(;(3&n.length)>0;)n+=S;return n}function b(t){var e,r,n,i="",o=0;for(e=0;e<t.length&&t.charAt(e)!=S;++e)(n=_.indexOf(t.charAt(e)))<0||(0==o?(i+=D(n>>2),r=3&n,o=1):1==o?(i+=D(r<<2|n>>4),r=15&n,o=2):2==o?(i+=D(r),i+=D(n>>2),r=3&n,o=3):(i+=D(r<<2|n>>4),i+=D(15&n),o=0));return 1==o&&(i+=D(r<<2)),i}function w(t){var e,r=b(t),n=new Array;for(e=0;2*e<r.length;++e)n[e]=parseInt(r.substring(2*e,2*e+2),16);return n}function E(t,e,r){null!=t&&("number"==typeof t?this.fromNumber(t,e,r):null==e&&"string"!=typeof t?this.fromString(t,256):this.fromString(t,e));}function x(){return new E(null)}(E.prototype.am=function A(t,e,r,n,i,o){for(;--o>=0;){var s=e*this[t++]+r[n]+i;i=Math.floor(s/67108864),r[n++]=67108863&s;}return i},m=26),E.prototype.DB=m,E.prototype.DM=(1<<m)-1,E.prototype.DV=1<<m;E.prototype.FV=Math.pow(2,52),E.prototype.F1=52-m,E.prototype.F2=2*m-52;var C,T,R="0123456789abcdefghijklmnopqrstuvwxyz",I=new Array;for(C="0".charCodeAt(0),T=0;T<=9;++T)I[C++]=T;for(C="a".charCodeAt(0),T=10;T<36;++T)I[C++]=T;for(C="A".charCodeAt(0),T=10;T<36;++T)I[C++]=T;function D(t){return R.charAt(t)}function U(t,e){var r=I[t.charCodeAt(e)];return null==r?-1:r}function L(t){var e=x();return e.fromInt(t),e}function B(t){var e,r=1;return 0!=(e=t>>>16)&&(t=e,r+=16),0!=(e=t>>8)&&(t=e,r+=8),0!=(e=t>>4)&&(t=e,r+=4),0!=(e=t>>2)&&(t=e,r+=2),0!=(e=t>>1)&&(t=e,r+=1),r}function N(t){this.m=t;}function O(t){this.m=t,this.mp=t.invDigit(),this.mpl=32767&this.mp,this.mph=this.mp>>15,this.um=(1<<t.DB-15)-1,this.mt2=2*t.t;}function j(t,e){return t&e}function H(t,e){return t|e}function M(t,e){return t^e}function K(t,e){return t&~e}function V(t){if(0==t)return -1;var e=0;return 0==(65535&t)&&(t>>=16,e+=16),0==(255&t)&&(t>>=8,e+=8),0==(15&t)&&(t>>=4,e+=4),0==(3&t)&&(t>>=2,e+=2),0==(1&t)&&++e,e}function q(t){for(var e=0;0!=t;)t&=t-1,++e;return e}function J(){}function W(t){return t}function z(t){this.r2=x(),this.q3=x(),E.ONE.dlShiftTo(2*t.t,this.r2),this.mu=this.r2.divide(t),this.m=t;}N.prototype.convert=function Y(t){return t.s<0||t.compareTo(this.m)>=0?t.mod(this.m):t},N.prototype.revert=function G(t){return t},N.prototype.reduce=function X(t){t.divRemTo(this.m,null,t);},N.prototype.mulTo=function Q(t,e,r){t.multiplyTo(e,r),this.reduce(r);},N.prototype.sqrTo=function $(t,e){t.squareTo(e),this.reduce(e);},O.prototype.convert=function Z(t){var e=x();return t.abs().dlShiftTo(this.m.t,e),e.divRemTo(this.m,null,e),t.s<0&&e.compareTo(E.ZERO)>0&&this.m.subTo(e,e),e},O.prototype.revert=function tt(t){var e=x();return t.copyTo(e),this.reduce(e),e},O.prototype.reduce=function et(t){for(;t.t<=this.mt2;)t[t.t++]=0;for(var e=0;e<this.m.t;++e){var r=32767&t[e],n=r*this.mpl+((r*this.mph+(t[e]>>15)*this.mpl&this.um)<<15)&t.DM;for(t[r=e+this.m.t]+=this.m.am(0,n,t,e,0,this.m.t);t[r]>=t.DV;)t[r]-=t.DV,t[++r]++;}t.clamp(),t.drShiftTo(this.m.t,t),t.compareTo(this.m)>=0&&t.subTo(this.m,t);},O.prototype.mulTo=function rt(t,e,r){t.multiplyTo(e,r),this.reduce(r);},O.prototype.sqrTo=function nt(t,e){t.squareTo(e),this.reduce(e);},E.prototype.copyTo=function it(t){for(var e=this.t-1;e>=0;--e)t[e]=this[e];t.t=this.t,t.s=this.s;},E.prototype.fromInt=function ot(t){this.t=1,this.s=t<0?-1:0,t>0?this[0]=t:t<-1?this[0]=t+this.DV:this.t=0;},E.prototype.fromString=function st(t,e){var r;if(16==e)r=4;else if(8==e)r=3;else if(256==e)r=8;else if(2==e)r=1;else if(32==e)r=5;else {if(4!=e)return void this.fromRadix(t,e);r=2;}this.t=0,this.s=0;for(var n=t.length,i=!1,o=0;--n>=0;){var s=8==r?255&t[n]:U(t,n);s<0?"-"==t.charAt(n)&&(i=!0):(i=!1,0==o?this[this.t++]=s:o+r>this.DB?(this[this.t-1]|=(s&(1<<this.DB-o)-1)<<o,this[this.t++]=s>>this.DB-o):this[this.t-1]|=s<<o,(o+=r)>=this.DB&&(o-=this.DB));}8==r&&0!=(128&t[0])&&(this.s=-1,o>0&&(this[this.t-1]|=(1<<this.DB-o)-1<<o)),this.clamp(),i&&E.ZERO.subTo(this,this);},E.prototype.clamp=function at(){for(var t=this.s&this.DM;this.t>0&&this[this.t-1]==t;)--this.t;},E.prototype.dlShiftTo=function ut(t,e){var r;for(r=this.t-1;r>=0;--r)e[r+t]=this[r];for(r=t-1;r>=0;--r)e[r]=0;e.t=this.t+t,e.s=this.s;},E.prototype.drShiftTo=function ct(t,e){for(var r=t;r<this.t;++r)e[r-t]=this[r];e.t=Math.max(this.t-t,0),e.s=this.s;},E.prototype.lShiftTo=function ht(t,e){var r,n=t%this.DB,i=this.DB-n,o=(1<<i)-1,s=Math.floor(t/this.DB),a=this.s<<n&this.DM;for(r=this.t-1;r>=0;--r)e[r+s+1]=this[r]>>i|a,a=(this[r]&o)<<n;for(r=s-1;r>=0;--r)e[r]=0;e[s]=a,e.t=this.t+s+1,e.s=this.s,e.clamp();},E.prototype.rShiftTo=function lt(t,e){e.s=this.s;var r=Math.floor(t/this.DB);if(r>=this.t)e.t=0;else {var n=t%this.DB,i=this.DB-n,o=(1<<n)-1;e[0]=this[r]>>n;for(var s=r+1;s<this.t;++s)e[s-r-1]|=(this[s]&o)<<i,e[s-r]=this[s]>>n;n>0&&(e[this.t-r-1]|=(this.s&o)<<i),e.t=this.t-r,e.clamp();}},E.prototype.subTo=function ft(t,e){for(var r=0,n=0,i=Math.min(t.t,this.t);r<i;)n+=this[r]-t[r],e[r++]=n&this.DM,n>>=this.DB;if(t.t<this.t){for(n-=t.s;r<this.t;)n+=this[r],e[r++]=n&this.DM,n>>=this.DB;n+=this.s;}else {for(n+=this.s;r<t.t;)n-=t[r],e[r++]=n&this.DM,n>>=this.DB;n-=t.s;}e.s=n<0?-1:0,n<-1?e[r++]=this.DV+n:n>0&&(e[r++]=n),e.t=r,e.clamp();},E.prototype.multiplyTo=function dt(t,e){var r=this.abs(),n=t.abs(),i=r.t;for(e.t=i+n.t;--i>=0;)e[i]=0;for(i=0;i<n.t;++i)e[i+r.t]=r.am(0,n[i],e,i,0,r.t);e.s=0,e.clamp(),this.s!=t.s&&E.ZERO.subTo(e,e);},E.prototype.squareTo=function gt(t){for(var e=this.abs(),r=t.t=2*e.t;--r>=0;)t[r]=0;for(r=0;r<e.t-1;++r){var n=e.am(r,e[r],t,2*r,0,1);(t[r+e.t]+=e.am(r+1,2*e[r],t,2*r+1,n,e.t-r-1))>=e.DV&&(t[r+e.t]-=e.DV,t[r+e.t+1]=1);}t.t>0&&(t[t.t-1]+=e.am(r,e[r],t,2*r,0,1)),t.s=0,t.clamp();},E.prototype.divRemTo=function pt(t,e,r){var n=t.abs();if(!(n.t<=0)){var i=this.abs();if(i.t<n.t)return null!=e&&e.fromInt(0),void(null!=r&&this.copyTo(r));null==r&&(r=x());var o=x(),s=this.s,a=t.s,u=this.DB-B(n[n.t-1]);u>0?(n.lShiftTo(u,o),i.lShiftTo(u,r)):(n.copyTo(o),i.copyTo(r));var c=o.t,h=o[c-1];if(0!=h){var l=h*(1<<this.F1)+(c>1?o[c-2]>>this.F2:0),f=this.FV/l,d=(1<<this.F1)/l,g=1<<this.F2,p=r.t,v=p-c,y=null==e?x():e;for(o.dlShiftTo(v,y),r.compareTo(y)>=0&&(r[r.t++]=1,r.subTo(y,r)),E.ONE.dlShiftTo(c,y),y.subTo(o,o);o.t<c;)o[o.t++]=0;for(;--v>=0;){var m=r[--p]==h?this.DM:Math.floor(r[p]*f+(r[p-1]+g)*d);if((r[p]+=o.am(0,m,r,v,0,c))<m)for(o.dlShiftTo(v,y),r.subTo(y,r);r[p]<--m;)r.subTo(y,r);}null!=e&&(r.drShiftTo(c,e),s!=a&&E.ZERO.subTo(e,e)),r.t=c,r.clamp(),u>0&&r.rShiftTo(u,r),s<0&&E.ZERO.subTo(r,r);}}},E.prototype.invDigit=function vt(){if(this.t<1)return 0;var t=this[0];if(0==(1&t))return 0;var e=3&t;return (e=(e=(e=(e=e*(2-(15&t)*e)&15)*(2-(255&t)*e)&255)*(2-((65535&t)*e&65535))&65535)*(2-t*e%this.DV)%this.DV)>0?this.DV-e:-e},E.prototype.isEven=function yt(){return 0==(this.t>0?1&this[0]:this.s)},E.prototype.exp=function mt(t,e){if(t>4294967295||t<1)return E.ONE;var r=x(),n=x(),i=e.convert(this),o=B(t)-1;for(i.copyTo(r);--o>=0;)if(e.sqrTo(r,n),(t&1<<o)>0)e.mulTo(n,i,r);else {var s=r;r=n,n=s;}return e.revert(r)},E.prototype.toString=function _t(t){if(this.s<0)return "-"+this.negate().toString(t);var e;if(16==t)e=4;else if(8==t)e=3;else if(2==t)e=1;else if(32==t)e=5;else {if(4!=t)return this.toRadix(t);e=2;}var r,n=(1<<e)-1,i=!1,o="",s=this.t,a=this.DB-s*this.DB%e;if(s-- >0)for(a<this.DB&&(r=this[s]>>a)>0&&(i=!0,o=D(r));s>=0;)a<e?(r=(this[s]&(1<<a)-1)<<e-a,r|=this[--s]>>(a+=this.DB-e)):(r=this[s]>>(a-=e)&n,a<=0&&(a+=this.DB,--s)),r>0&&(i=!0),i&&(o+=D(r));return i?o:"0"},E.prototype.negate=function St(){var t=x();return E.ZERO.subTo(this,t),t},E.prototype.abs=function Ft(){return this.s<0?this.negate():this},E.prototype.compareTo=function bt(t){var e=this.s-t.s;if(0!=e)return e;var r=this.t;if(0!=(e=r-t.t))return this.s<0?-e:e;for(;--r>=0;)if(0!=(e=this[r]-t[r]))return e;return 0},E.prototype.bitLength=function wt(){return this.t<=0?0:this.DB*(this.t-1)+B(this[this.t-1]^this.s&this.DM)},E.prototype.mod=function Et(t){var e=x();return this.abs().divRemTo(t,null,e),this.s<0&&e.compareTo(E.ZERO)>0&&t.subTo(e,e),e},E.prototype.modPowInt=function xt(t,e){var r;return r=t<256||e.isEven()?new N(e):new O(e),this.exp(t,r)},E.ZERO=L(0),E.ONE=L(1),J.prototype.convert=W,J.prototype.revert=W,J.prototype.mulTo=function kt(t,e,r){t.multiplyTo(e,r);},J.prototype.sqrTo=function At(t,e){t.squareTo(e);},z.prototype.convert=function Pt(t){if(t.s<0||t.t>2*this.m.t)return t.mod(this.m);if(t.compareTo(this.m)<0)return t;var e=x();return t.copyTo(e),this.reduce(e),e},z.prototype.revert=function Ct(t){return t},z.prototype.reduce=function Tt(t){for(t.drShiftTo(this.m.t-1,this.r2),t.t>this.m.t+1&&(t.t=this.m.t+1,t.clamp()),this.mu.multiplyUpperTo(this.r2,this.m.t+1,this.q3),this.m.multiplyLowerTo(this.q3,this.m.t+1,this.r2);t.compareTo(this.r2)<0;)t.dAddOffset(1,this.m.t+1);for(t.subTo(this.r2,t);t.compareTo(this.m)>=0;)t.subTo(this.m,t);},z.prototype.mulTo=function Rt(t,e,r){t.multiplyTo(e,r),this.reduce(r);},z.prototype.sqrTo=function It(t,e){t.squareTo(e),this.reduce(e);};var Dt=[2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97,101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199,211,223,227,229,233,239,241,251,257,263,269,271,277,281,283,293,307,311,313,317,331,337,347,349,353,359,367,373,379,383,389,397,401,409,419,421,431,433,439,443,449,457,461,463,467,479,487,491,499,503,509,521,523,541,547,557,563,569,571,577,587,593,599,601,607,613,617,619,631,641,643,647,653,659,661,673,677,683,691,701,709,719,727,733,739,743,751,757,761,769,773,787,797,809,811,821,823,827,829,839,853,857,859,863,877,881,883,887,907,911,919,929,937,941,947,953,967,971,977,983,991,997],Ut=(1<<26)/Dt[Dt.length-1];
    /*! (c) Tom Wu | http://www-cs-students.stanford.edu/~tjw/jsbn/
     */
    function Lt(){this.i=0,this.j=0,this.S=new Array;}E.prototype.chunkSize=function Bt(t){return Math.floor(Math.LN2*this.DB/Math.log(t))},E.prototype.toRadix=function Nt(t){if(null==t&&(t=10),0==this.signum()||t<2||t>36)return "0";var e=this.chunkSize(t),r=Math.pow(t,e),n=L(r),i=x(),o=x(),s="";for(this.divRemTo(n,i,o);i.signum()>0;)s=(r+o.intValue()).toString(t).substr(1)+s,i.divRemTo(n,i,o);return o.intValue().toString(t)+s},E.prototype.fromRadix=function Ot(t,e){this.fromInt(0),null==e&&(e=10);for(var r=this.chunkSize(e),n=Math.pow(e,r),i=!1,o=0,s=0,a=0;a<t.length;++a){var u=U(t,a);u<0?"-"==t.charAt(a)&&0==this.signum()&&(i=!0):(s=e*s+u,++o>=r&&(this.dMultiply(n),this.dAddOffset(s,0),o=0,s=0));}o>0&&(this.dMultiply(Math.pow(e,o)),this.dAddOffset(s,0)),i&&E.ZERO.subTo(this,this);},E.prototype.fromNumber=function jt(t,e,r){if("number"==typeof e)if(t<2)this.fromInt(1);else for(this.fromNumber(t,r),this.testBit(t-1)||this.bitwiseTo(E.ONE.shiftLeft(t-1),H,this),this.isEven()&&this.dAddOffset(1,0);!this.isProbablePrime(e);)this.dAddOffset(2,0),this.bitLength()>t&&this.subTo(E.ONE.shiftLeft(t-1),this);else {var n=new Array,i=7&t;n.length=1+(t>>3),e.nextBytes(n),i>0?n[0]&=(1<<i)-1:n[0]=0,this.fromString(n,256);}},E.prototype.bitwiseTo=function Ht(t,e,r){var n,i,o=Math.min(t.t,this.t);for(n=0;n<o;++n)r[n]=e(this[n],t[n]);if(t.t<this.t){for(i=t.s&this.DM,n=o;n<this.t;++n)r[n]=e(this[n],i);r.t=this.t;}else {for(i=this.s&this.DM,n=o;n<t.t;++n)r[n]=e(i,t[n]);r.t=t.t;}r.s=e(this.s,t.s),r.clamp();},E.prototype.changeBit=function Mt(t,e){var r=E.ONE.shiftLeft(t);return this.bitwiseTo(r,e,r),r},E.prototype.addTo=function Kt(t,e){for(var r=0,n=0,i=Math.min(t.t,this.t);r<i;)n+=this[r]+t[r],e[r++]=n&this.DM,n>>=this.DB;if(t.t<this.t){for(n+=t.s;r<this.t;)n+=this[r],e[r++]=n&this.DM,n>>=this.DB;n+=this.s;}else {for(n+=this.s;r<t.t;)n+=t[r],e[r++]=n&this.DM,n>>=this.DB;n+=t.s;}e.s=n<0?-1:0,n>0?e[r++]=n:n<-1&&(e[r++]=this.DV+n),e.t=r,e.clamp();},E.prototype.dMultiply=function Vt(t){this[this.t]=this.am(0,t-1,this,0,0,this.t),++this.t,this.clamp();},E.prototype.dAddOffset=function qt(t,e){if(0!=t){for(;this.t<=e;)this[this.t++]=0;for(this[e]+=t;this[e]>=this.DV;)this[e]-=this.DV,++e>=this.t&&(this[this.t++]=0),++this[e];}},E.prototype.multiplyLowerTo=function Jt(t,e,r){var n,i=Math.min(this.t+t.t,e);for(r.s=0,r.t=i;i>0;)r[--i]=0;for(n=r.t-this.t;i<n;++i)r[i+this.t]=this.am(0,t[i],r,i,0,this.t);for(n=Math.min(t.t,e);i<n;++i)this.am(0,t[i],r,i,0,e-i);r.clamp();},E.prototype.multiplyUpperTo=function Wt(t,e,r){--e;var n=r.t=this.t+t.t-e;for(r.s=0;--n>=0;)r[n]=0;for(n=Math.max(e-this.t,0);n<t.t;++n)r[this.t+n-e]=this.am(e-n,t[n],r,0,0,this.t+n-e);r.clamp(),r.drShiftTo(1,r);},E.prototype.modInt=function zt(t){if(t<=0)return 0;var e=this.DV%t,r=this.s<0?t-1:0;if(this.t>0)if(0==e)r=this[0]%t;else for(var n=this.t-1;n>=0;--n)r=(e*r+this[n])%t;return r},E.prototype.millerRabin=function Yt(t){var e=this.subtract(E.ONE),r=e.getLowestSetBit();if(r<=0)return !1;var n=e.shiftRight(r);(t=t+1>>1)>Dt.length&&(t=Dt.length);for(var i=x(),o=0;o<t;++o){i.fromInt(Dt[Math.floor(Math.random()*Dt.length)]);var s=i.modPow(n,this);if(0!=s.compareTo(E.ONE)&&0!=s.compareTo(e)){for(var a=1;a++<r&&0!=s.compareTo(e);)if(0==(s=s.modPowInt(2,this)).compareTo(E.ONE))return !1;if(0!=s.compareTo(e))return !1}}return !0},E.prototype.clone=
    /*! (c) Tom Wu | http://www-cs-students.stanford.edu/~tjw/jsbn/
     */
    function Gt(){var t=x();return this.copyTo(t),t},E.prototype.intValue=function Xt(){if(this.s<0){if(1==this.t)return this[0]-this.DV;if(0==this.t)return -1}else {if(1==this.t)return this[0];if(0==this.t)return 0}return (this[1]&(1<<32-this.DB)-1)<<this.DB|this[0]},E.prototype.byteValue=function Qt(){return 0==this.t?this.s:this[0]<<24>>24},E.prototype.shortValue=function $t(){return 0==this.t?this.s:this[0]<<16>>16},E.prototype.signum=function Zt(){return this.s<0?-1:this.t<=0||1==this.t&&this[0]<=0?0:1},E.prototype.toByteArray=function te(){var t=this.t,e=new Array;e[0]=this.s;var r,n=this.DB-t*this.DB%8,i=0;if(t-- >0)for(n<this.DB&&(r=this[t]>>n)!=(this.s&this.DM)>>n&&(e[i++]=r|this.s<<this.DB-n);t>=0;)n<8?(r=(this[t]&(1<<n)-1)<<8-n,r|=this[--t]>>(n+=this.DB-8)):(r=this[t]>>(n-=8)&255,n<=0&&(n+=this.DB,--t)),0!=(128&r)&&(r|=-256),0==i&&(128&this.s)!=(128&r)&&++i,(i>0||r!=this.s)&&(e[i++]=r);return e},E.prototype.equals=function ee(t){return 0==this.compareTo(t)},E.prototype.min=function re(t){return this.compareTo(t)<0?this:t},E.prototype.max=function ne(t){return this.compareTo(t)>0?this:t},E.prototype.and=function ie(t){var e=x();return this.bitwiseTo(t,j,e),e},E.prototype.or=function oe(t){var e=x();return this.bitwiseTo(t,H,e),e},E.prototype.xor=function se(t){var e=x();return this.bitwiseTo(t,M,e),e},E.prototype.andNot=function ae(t){var e=x();return this.bitwiseTo(t,K,e),e},E.prototype.not=function ue(){for(var t=x(),e=0;e<this.t;++e)t[e]=this.DM&~this[e];return t.t=this.t,t.s=~this.s,t},E.prototype.shiftLeft=function ce(t){var e=x();return t<0?this.rShiftTo(-t,e):this.lShiftTo(t,e),e},E.prototype.shiftRight=function he(t){var e=x();return t<0?this.lShiftTo(-t,e):this.rShiftTo(t,e),e},E.prototype.getLowestSetBit=function le(){for(var t=0;t<this.t;++t)if(0!=this[t])return t*this.DB+V(this[t]);return this.s<0?this.t*this.DB:-1},E.prototype.bitCount=function fe(){for(var t=0,e=this.s&this.DM,r=0;r<this.t;++r)t+=q(this[r]^e);return t},E.prototype.testBit=function de(t){var e=Math.floor(t/this.DB);return e>=this.t?0!=this.s:0!=(this[e]&1<<t%this.DB)},E.prototype.setBit=function ge(t){return this.changeBit(t,H)},E.prototype.clearBit=function pe(t){return this.changeBit(t,K)},E.prototype.flipBit=function ve(t){return this.changeBit(t,M)},E.prototype.add=function ye(t){var e=x();return this.addTo(t,e),e},E.prototype.subtract=function me(t){var e=x();return this.subTo(t,e),e},E.prototype.multiply=function _e(t){var e=x();return this.multiplyTo(t,e),e},E.prototype.divide=function Se(t){var e=x();return this.divRemTo(t,e,null),e},E.prototype.remainder=function Fe(t){var e=x();return this.divRemTo(t,null,e),e},E.prototype.divideAndRemainder=function be(t){var e=x(),r=x();return this.divRemTo(t,e,r),new Array(e,r)},E.prototype.modPow=function we(t,e){var r,n,i=t.bitLength(),o=L(1);if(i<=0)return o;r=i<18?1:i<48?3:i<144?4:i<768?5:6,n=i<8?new N(e):e.isEven()?new z(e):new O(e);var s=new Array,a=3,u=r-1,c=(1<<r)-1;if(s[1]=n.convert(this),r>1){var h=x();for(n.sqrTo(s[1],h);a<=c;)s[a]=x(),n.mulTo(h,s[a-2],s[a]),a+=2;}var l,f,d=t.t-1,g=!0,p=x();for(i=B(t[d])-1;d>=0;){for(i>=u?l=t[d]>>i-u&c:(l=(t[d]&(1<<i+1)-1)<<u-i,d>0&&(l|=t[d-1]>>this.DB+i-u)),a=r;0==(1&l);)l>>=1,--a;if((i-=a)<0&&(i+=this.DB,--d),g)s[l].copyTo(o),g=!1;else {for(;a>1;)n.sqrTo(o,p),n.sqrTo(p,o),a-=2;a>0?n.sqrTo(o,p):(f=o,o=p,p=f),n.mulTo(p,s[l],o);}for(;d>=0&&0==(t[d]&1<<i);)n.sqrTo(o,p),f=o,o=p,p=f,--i<0&&(i=this.DB-1,--d);}return n.revert(o)},E.prototype.modInverse=function Ee(t){var e=t.isEven();if(this.isEven()&&e||0==t.signum())return E.ZERO;for(var r=t.clone(),n=this.clone(),i=L(1),o=L(0),s=L(0),a=L(1);0!=r.signum();){for(;r.isEven();)r.rShiftTo(1,r),e?(i.isEven()&&o.isEven()||(i.addTo(this,i),o.subTo(t,o)),i.rShiftTo(1,i)):o.isEven()||o.subTo(t,o),o.rShiftTo(1,o);for(;n.isEven();)n.rShiftTo(1,n),e?(s.isEven()&&a.isEven()||(s.addTo(this,s),a.subTo(t,a)),s.rShiftTo(1,s)):a.isEven()||a.subTo(t,a),a.rShiftTo(1,a);r.compareTo(n)>=0?(r.subTo(n,r),e&&i.subTo(s,i),o.subTo(a,o)):(n.subTo(r,n),e&&s.subTo(i,s),a.subTo(o,a));}return 0!=n.compareTo(E.ONE)?E.ZERO:a.compareTo(t)>=0?a.subtract(t):a.signum()<0?(a.addTo(t,a),a.signum()<0?a.add(t):a):a},E.prototype.pow=function xe(t){return this.exp(t,new J)},E.prototype.gcd=function ke(t){var e=this.s<0?this.negate():this.clone(),r=t.s<0?t.negate():t.clone();if(e.compareTo(r)<0){var n=e;e=r,r=n;}var i=e.getLowestSetBit(),o=r.getLowestSetBit();if(o<0)return e;for(i<o&&(o=i),o>0&&(e.rShiftTo(o,e),r.rShiftTo(o,r));e.signum()>0;)(i=e.getLowestSetBit())>0&&e.rShiftTo(i,e),(i=r.getLowestSetBit())>0&&r.rShiftTo(i,r),e.compareTo(r)>=0?(e.subTo(r,e),e.rShiftTo(1,e)):(r.subTo(e,r),r.rShiftTo(1,r));return o>0&&r.lShiftTo(o,r),r},E.prototype.isProbablePrime=function Ae(t){var e,r=this.abs();if(1==r.t&&r[0]<=Dt[Dt.length-1]){for(e=0;e<Dt.length;++e)if(r[0]==Dt[e])return !0;return !1}if(r.isEven())return !1;for(e=1;e<Dt.length;){for(var n=Dt[e],i=e+1;i<Dt.length&&n<Ut;)n*=Dt[i++];for(n=r.modInt(n);e<i;)if(n%Dt[e++]==0)return !1}return r.millerRabin(t)},E.prototype.square=function Pe(){var t=x();return this.squareTo(t),t},Lt.prototype.init=function Ce(t){var e,r,n;for(e=0;e<256;++e)this.S[e]=e;for(r=0,e=0;e<256;++e)r=r+this.S[e]+t[e%t.length]&255,n=this.S[e],this.S[e]=this.S[r],this.S[r]=n;this.i=0,this.j=0;},Lt.prototype.next=function Te(){var t;return this.i=this.i+1&255,this.j=this.j+this.S[this.i]&255,t=this.S[this.i],this.S[this.i]=this.S[this.j],this.S[this.j]=t,this.S[t+this.S[this.i]&255]};var Re,Ie,De,Ue=256;
    /*! (c) Tom Wu | http://www-cs-students.stanford.edu/~tjw/jsbn/
     */function Le(){!function t(e){Ie[De++]^=255&e,Ie[De++]^=e>>8&255,Ie[De++]^=e>>16&255,Ie[De++]^=e>>24&255,De>=Ue&&(De-=Ue);}((new Date).getTime());}if(null==Ie){var Be;if(Ie=new Array,De=0,void 0!==i&&(void 0!==i.msCrypto)){var Ne=i.msCrypto;if(Ne.getRandomValues){var Oe=new Uint8Array(32);for(Ne.getRandomValues(Oe),Be=0;Be<32;++Be)Ie[De++]=Oe[Be];}}for(;De<Ue;)Be=Math.floor(65536*Math.random()),Ie[De++]=Be>>>8,Ie[De++]=255&Be;De=0,Le();}function He(){if(null==Re){for(Le(),(Re=function t(){return new Lt}()).init(Ie),De=0;De<Ie.length;++De)Ie[De]=0;De=0;}return Re.next()}function Me(){}
    /*! (c) Tom Wu | http://www-cs-students.stanford.edu/~tjw/jsbn/
     */
    function Ke(t,e){return new E(t,e)}function Ve(t,e,r){for(var n="",i=0;n.length<e;)n+=r(String.fromCharCode.apply(String,t.concat([(4278190080&i)>>24,(16711680&i)>>16,(65280&i)>>8,255&i]))),i+=1;return n}function qe(){this.n=null,this.e=0,this.d=null,this.p=null,this.q=null,this.dmp1=null,this.dmq1=null,this.coeff=null;}
    /*! (c) Tom Wu | http://www-cs-students.stanford.edu/~tjw/jsbn/
     */
    function Je(t,e){this.x=e,this.q=t;}function We(t,e,r,n){this.curve=t,this.x=e,this.y=r,this.z=null==n?E.ONE:n,this.zinv=null;}function ze(t,e,r){this.q=t,this.a=this.fromBigInteger(e),this.b=this.fromBigInteger(r),this.infinity=new We(this,null,null);}Me.prototype.nextBytes=function Ye(t){var e;for(e=0;e<t.length;++e)t[e]=He();},qe.prototype.doPublic=function Ge(t){return t.modPowInt(this.e,this.n)},qe.prototype.setPublic=function Xe(t,e){if(this.isPublic=!0,this.isPrivate=!1,"string"!=typeof t)this.n=t,this.e=e;else {if(!(null!=t&&null!=e&&t.length>0&&e.length>0))throw "Invalid RSA public key";this.n=Ke(t,16),this.e=parseInt(e,16);}},qe.prototype.encrypt=function Qe(t){var e=function r(t,e){if(e<t.length+11)throw "Message too long for RSA";for(var r=new Array,n=t.length-1;n>=0&&e>0;){var i=t.charCodeAt(n--);i<128?r[--e]=i:i>127&&i<2048?(r[--e]=63&i|128,r[--e]=i>>6|192):(r[--e]=63&i|128,r[--e]=i>>6&63|128,r[--e]=i>>12|224);}r[--e]=0;for(var o=new Me,s=new Array;e>2;){for(s[0]=0;0==s[0];)o.nextBytes(s);r[--e]=s[0];}return r[--e]=2,r[--e]=0,new E(r)}(t,this.n.bitLength()+7>>3);if(null==e)return null;var n=this.doPublic(e);if(null==n)return null;var i=n.toString(16);return 0==(1&i.length)?i:"0"+i},qe.prototype.encryptOAEP=function $e(t,e,r){var n=function i(t,e,r,n){var i=Er.crypto.MessageDigest,o=Er.crypto.Util,s=null;if(r||(r="sha1"),"string"==typeof r&&(s=i.getCanonicalAlgName(r),n=i.getHashLength(s),r=function t(e){return Or(o.hashHex(jr(e),s))}),t.length+2*n+2>e)throw "Message too long for RSA";var a,u="";for(a=0;a<e-t.length-2*n-2;a+=1)u+="\0";var c=r("")+u+""+t,h=new Array(n);(new Me).nextBytes(h);var l=Ve(h,c.length,r),f=[];for(a=0;a<c.length;a+=1)f[a]=c.charCodeAt(a)^l.charCodeAt(a);var d=Ve(f,h.length,r),g=[0];for(a=0;a<h.length;a+=1)g[a+1]=h[a]^d.charCodeAt(a);return new E(g.concat(f))}(t,this.n.bitLength()+7>>3,e,r);if(null==n)return null;var o=this.doPublic(n);if(null==o)return null;var s=o.toString(16);return 0==(1&s.length)?s:"0"+s},qe.prototype.type="RSA",Je.prototype.equals=function Ze(t){return t==this||this.q.equals(t.q)&&this.x.equals(t.x)},Je.prototype.toBigInteger=function tr(){return this.x},Je.prototype.negate=function er(){return new Je(this.q,this.x.negate().mod(this.q))},Je.prototype.add=function rr(t){return new Je(this.q,this.x.add(t.toBigInteger()).mod(this.q))},Je.prototype.subtract=function nr(t){return new Je(this.q,this.x.subtract(t.toBigInteger()).mod(this.q))},Je.prototype.multiply=function ir(t){return new Je(this.q,this.x.multiply(t.toBigInteger()).mod(this.q))},Je.prototype.square=function or(){return new Je(this.q,this.x.square().mod(this.q))},Je.prototype.divide=function sr(t){return new Je(this.q,this.x.multiply(t.toBigInteger().modInverse(this.q)).mod(this.q))},We.prototype.getX=function ar(){return null==this.zinv&&(this.zinv=this.z.modInverse(this.curve.q)),this.curve.fromBigInteger(this.x.toBigInteger().multiply(this.zinv).mod(this.curve.q))},We.prototype.getY=function ur(){return null==this.zinv&&(this.zinv=this.z.modInverse(this.curve.q)),this.curve.fromBigInteger(this.y.toBigInteger().multiply(this.zinv).mod(this.curve.q))},We.prototype.equals=function cr(t){return t==this||(this.isInfinity()?t.isInfinity():t.isInfinity()?this.isInfinity():!!t.y.toBigInteger().multiply(this.z).subtract(this.y.toBigInteger().multiply(t.z)).mod(this.curve.q).equals(E.ZERO)&&t.x.toBigInteger().multiply(this.z).subtract(this.x.toBigInteger().multiply(t.z)).mod(this.curve.q).equals(E.ZERO))},We.prototype.isInfinity=function hr(){return null==this.x&&null==this.y||this.z.equals(E.ZERO)&&!this.y.toBigInteger().equals(E.ZERO)},We.prototype.negate=function lr(){return new We(this.curve,this.x,this.y.negate(),this.z)},We.prototype.add=function fr(t){if(this.isInfinity())return t;if(t.isInfinity())return this;var e=t.y.toBigInteger().multiply(this.z).subtract(this.y.toBigInteger().multiply(t.z)).mod(this.curve.q),r=t.x.toBigInteger().multiply(this.z).subtract(this.x.toBigInteger().multiply(t.z)).mod(this.curve.q);if(E.ZERO.equals(r))return E.ZERO.equals(e)?this.twice():this.curve.getInfinity();var n=new E("3"),i=this.x.toBigInteger(),o=this.y.toBigInteger(),s=(t.x.toBigInteger(),t.y.toBigInteger(),r.square()),a=s.multiply(r),u=i.multiply(s),c=e.square().multiply(this.z),h=c.subtract(u.shiftLeft(1)).multiply(t.z).subtract(a).multiply(r).mod(this.curve.q),l=u.multiply(n).multiply(e).subtract(o.multiply(a)).subtract(c.multiply(e)).multiply(t.z).add(e.multiply(a)).mod(this.curve.q),f=a.multiply(this.z).multiply(t.z).mod(this.curve.q);return new We(this.curve,this.curve.fromBigInteger(h),this.curve.fromBigInteger(l),f)},We.prototype.twice=function dr(){if(this.isInfinity())return this;if(0==this.y.toBigInteger().signum())return this.curve.getInfinity();var t=new E("3"),e=this.x.toBigInteger(),r=this.y.toBigInteger(),n=r.multiply(this.z),i=n.multiply(r).mod(this.curve.q),o=this.curve.a.toBigInteger(),s=e.square().multiply(t);E.ZERO.equals(o)||(s=s.add(this.z.square().multiply(o)));var a=(s=s.mod(this.curve.q)).square().subtract(e.shiftLeft(3).multiply(i)).shiftLeft(1).multiply(n).mod(this.curve.q),u=s.multiply(t).multiply(e).subtract(i.shiftLeft(1)).shiftLeft(2).multiply(i).subtract(s.square().multiply(s)).mod(this.curve.q),c=n.square().multiply(n).shiftLeft(3).mod(this.curve.q);return new We(this.curve,this.curve.fromBigInteger(a),this.curve.fromBigInteger(u),c)},We.prototype.multiply=function gr(t){if(this.isInfinity())return this;if(0==t.signum())return this.curve.getInfinity();var e,r=t,n=r.multiply(new E("3")),i=this.negate(),o=this;for(e=n.bitLength()-2;e>0;--e){o=o.twice();var s=n.testBit(e);s!=r.testBit(e)&&(o=o.add(s?this:i));}return o},We.prototype.multiplyTwo=function pr(t,e,r){var n;n=t.bitLength()>r.bitLength()?t.bitLength()-1:r.bitLength()-1;for(var i=this.curve.getInfinity(),o=this.add(e);n>=0;)i=i.twice(),t.testBit(n)?i=r.testBit(n)?i.add(o):i.add(this):r.testBit(n)&&(i=i.add(e)),--n;return i},ze.prototype.getQ=function vr(){return this.q},ze.prototype.getA=function yr(){return this.a},ze.prototype.getB=function mr(){return this.b},ze.prototype.equals=function _r(t){return t==this||this.q.equals(t.q)&&this.a.equals(t.a)&&this.b.equals(t.b)},ze.prototype.getInfinity=function Sr(){return this.infinity},ze.prototype.fromBigInteger=function Fr(t){return new Je(this.q,t)},ze.prototype.decodePointHex=function br(t){switch(parseInt(t.substr(0,2),16)){case 0:return this.infinity;case 2:case 3:return null;case 4:case 6:case 7:var e=(t.length-2)/2,r=t.substr(2,e),n=t.substr(e+2,e);return new We(this,this.fromBigInteger(new E(r,16)),this.fromBigInteger(new E(n,16)));default:return null}},
    /*! (c) Stefan Thomas | https://github.com/bitcoinjs/bitcoinjs-lib
     */
    Je.prototype.getByteLength=function(){return Math.floor((this.toBigInteger().bitLength()+7)/8)},We.prototype.getEncoded=function(t){var e=function t(e,r){var n=e.toByteArrayUnsigned();if(r<n.length)n=n.slice(n.length-r);else for(;r>n.length;)n.unshift(0);return n},r=this.getX().toBigInteger(),n=this.getY().toBigInteger(),i=e(r,32);return t?n.isEven()?i.unshift(2):i.unshift(3):(i.unshift(4),i=i.concat(e(n,32))),i},We.decodeFrom=function(t,e){e[0];var r=e.length-1,n=e.slice(1,1+r/2),i=e.slice(1+r/2,1+r);n.unshift(0),i.unshift(0);var o=new E(n),s=new E(i);return new We(t,t.fromBigInteger(o),t.fromBigInteger(s))},We.decodeFromHex=function(t,e){e.substr(0,2);var r=e.length-2,n=e.substr(2,r/2),i=e.substr(2+r/2,r/2),o=new E(n,16),s=new E(i,16);return new We(t,t.fromBigInteger(o),t.fromBigInteger(s))},We.prototype.add2D=function(t){if(this.isInfinity())return t;if(t.isInfinity())return this;if(this.x.equals(t.x))return this.y.equals(t.y)?this.twice():this.curve.getInfinity();var e=t.x.subtract(this.x),r=t.y.subtract(this.y).divide(e),n=r.square().subtract(this.x).subtract(t.x),i=r.multiply(this.x.subtract(n)).subtract(this.y);return new We(this.curve,n,i)},We.prototype.twice2D=function(){if(this.isInfinity())return this;if(0==this.y.toBigInteger().signum())return this.curve.getInfinity();var t=this.curve.fromBigInteger(E.valueOf(2)),e=this.curve.fromBigInteger(E.valueOf(3)),r=this.x.square().multiply(e).add(this.curve.a).divide(this.y.multiply(t)),n=r.square().subtract(this.x.multiply(t)),i=r.multiply(this.x.subtract(n)).subtract(this.y);return new We(this.curve,n,i)},We.prototype.multiply2D=function(t){if(this.isInfinity())return this;if(0==t.signum())return this.curve.getInfinity();var e,r=t,n=r.multiply(new E("3")),i=this.negate(),o=this;for(e=n.bitLength()-2;e>0;--e){o=o.twice();var s=n.testBit(e);s!=r.testBit(e)&&(o=o.add2D(s?this:i));}return o},We.prototype.isOnCurve=function(){var t=this.getX().toBigInteger(),e=this.getY().toBigInteger(),r=this.curve.getA().toBigInteger(),n=this.curve.getB().toBigInteger(),i=this.curve.getQ(),o=e.multiply(e).mod(i),s=t.multiply(t).multiply(t).add(r.multiply(t)).add(n).mod(i);return o.equals(s)},We.prototype.toString=function(){return "("+this.getX().toBigInteger().toString()+","+this.getY().toBigInteger().toString()+")"},We.prototype.validate=function(){var t=this.curve.getQ();if(this.isInfinity())throw new Error("Point is at infinity.");var e=this.getX().toBigInteger(),r=this.getY().toBigInteger();if(e.compareTo(E.ONE)<0||e.compareTo(t.subtract(E.ONE))>0)throw new Error("x coordinate out of bounds");if(r.compareTo(E.ONE)<0||r.compareTo(t.subtract(E.ONE))>0)throw new Error("y coordinate out of bounds");if(!this.isOnCurve())throw new Error("Point is not on the curve.");if(this.multiply(t).isInfinity())throw new Error("Point is not a scalar multiple of G.");return !0};
    /*! Mike Samuel (c) 2009 | code.google.com/p/json-sans-eval
     */
    var wr=function(){var t=new RegExp('(?:false|true|null|[\\{\\}\\[\\]]|(?:-?\\b(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?(?:[eE][+-]?[0-9]+)?\\b)|(?:"(?:[^\\0-\\x08\\x0a-\\x1f"\\\\]|\\\\(?:["/\\\\bfnrt]|u[0-9A-Fa-f]{4}))*"))',"g"),e=new RegExp("\\\\(?:([^u])|u(.{4}))","g"),n={'"':'"',"/":"/","\\":"\\",b:"\b",f:"\f",n:"\n",r:"\r",t:"\t"};function i(t,e,r){return e?n[e]:String.fromCharCode(parseInt(r,16))}var o=new String(""),s=(Object.hasOwnProperty);return function(n,a){var u,c,h=n.match(t),l=h[0],f=!1;"{"===l?u={}:"["===l?u=[]:(u=[],f=!0);for(var d=[u],g=1-f,p=h.length;g<p;++g){var v;switch((l=h[g]).charCodeAt(0)){default:(v=d[0])[c||v.length]=+l,c=void 0;break;case 34:if(-1!==(l=l.substring(1,l.length-1)).indexOf("\\")&&(l=l.replace(e,i)),v=d[0],!c){if(!(v instanceof Array)){c=l||o;break}c=v.length;}v[c]=l,c=void 0;break;case 91:v=d[0],d.unshift(v[c||v.length]=[]),c=void 0;break;case 93:d.shift();break;case 102:(v=d[0])[c||v.length]=!1,c=void 0;break;case 110:(v=d[0])[c||v.length]=null,c=void 0;break;case 116:(v=d[0])[c||v.length]=!0,c=void 0;break;case 123:v=d[0],d.unshift(v[c||v.length]={}),c=void 0;break;case 125:d.shift();}}if(f){if(1!==d.length)throw new Error;u=u[0];}else if(d.length)throw new Error;if(a){u=function t(e,n){var i=e[n];if(i&&"object"===(void 0===i?"undefined":r(i))){var o=null;for(var u in i)if(s.call(i,u)&&i!==e){var c=t(i,u);void 0!==c?i[u]=c:(o||(o=[]),o.push(u));}if(o)for(var h=o.length;--h>=0;)delete i[o[h]];}return a.call(e,n,i)}({"":u},"");}return u}}();void 0!==Er&&Er||(e.KJUR=Er={}),void 0!==Er.asn1&&Er.asn1||(Er.asn1={}),Er.asn1.ASN1Util=new function(){this.integerToByteHex=function(t){var e=t.toString(16);return e.length%2==1&&(e="0"+e),e},this.bigIntToMinTwosComplementsHex=function(t){var e=t.toString(16);if("-"!=e.substr(0,1))e.length%2==1?e="0"+e:e.match(/^[0-7]/)||(e="00"+e);else {var r=e.substr(1).length;r%2==1?r+=1:e.match(/^[0-7]/)||(r+=2);for(var n="",i=0;i<r;i++)n+="f";e=new E(n,16).xor(t).add(E.ONE).toString(16).replace(/^-/,"");}return e},this.getPEMStringFromHex=function(t,e){return Vr(t,e)},this.newObject=function(t){var e=Er.asn1,r=e.DERBoolean,n=e.DERInteger,i=e.DERBitString,o=e.DEROctetString,s=e.DERNull,a=e.DERObjectIdentifier,u=e.DEREnumerated,c=e.DERUTF8String,h=e.DERNumericString,l=e.DERPrintableString,f=e.DERTeletexString,d=e.DERIA5String,g=e.DERUTCTime,p=e.DERGeneralizedTime,v=e.DERSequence,y=e.DERSet,m=e.DERTaggedObject,_=e.ASN1Util.newObject,S=Object.keys(t);if(1!=S.length)throw "key of param shall be only one.";var F=S[0];if(-1==":bool:int:bitstr:octstr:null:oid:enum:utf8str:numstr:prnstr:telstr:ia5str:utctime:gentime:seq:set:tag:".indexOf(":"+F+":"))throw "undefined key: "+F;if("bool"==F)return new r(t[F]);if("int"==F)return new n(t[F]);if("bitstr"==F)return new i(t[F]);if("octstr"==F)return new o(t[F]);if("null"==F)return new s(t[F]);if("oid"==F)return new a(t[F]);if("enum"==F)return new u(t[F]);if("utf8str"==F)return new c(t[F]);if("numstr"==F)return new h(t[F]);if("prnstr"==F)return new l(t[F]);if("telstr"==F)return new f(t[F]);if("ia5str"==F)return new d(t[F]);if("utctime"==F)return new g(t[F]);if("gentime"==F)return new p(t[F]);if("seq"==F){for(var b=t[F],w=[],E=0;E<b.length;E++){var x=_(b[E]);w.push(x);}return new v({array:w})}if("set"==F){for(b=t[F],w=[],E=0;E<b.length;E++){x=_(b[E]);w.push(x);}return new y({array:w})}if("tag"==F){var k=t[F];if("[object Array]"===Object.prototype.toString.call(k)&&3==k.length){var A=_(k[2]);return new m({tag:k[0],explicit:k[1],obj:A})}var P={};if(void 0!==k.explicit&&(P.explicit=k.explicit),void 0!==k.tag&&(P.tag=k.tag),void 0===k.obj)throw "obj shall be specified for 'tag'.";return P.obj=_(k.obj),new m(P)}},this.jsonToASN1HEX=function(t){return this.newObject(t).getEncodedHex()};},Er.asn1.ASN1Util.oidHexToInt=function(t){for(var e="",r=parseInt(t.substr(0,2),16),n=(e=Math.floor(r/40)+"."+r%40,""),i=2;i<t.length;i+=2){var o=("00000000"+parseInt(t.substr(i,2),16).toString(2)).slice(-8);if(n+=o.substr(1,7),"0"==o.substr(0,1))e=e+"."+new E(n,2).toString(10),n="";}return e},Er.asn1.ASN1Util.oidIntToHex=function(t){var e=function t(e){var r=e.toString(16);return 1==r.length&&(r="0"+r),r},r=function t(r){var n="",i=new E(r,10).toString(2),o=7-i.length%7;7==o&&(o=0);for(var s="",a=0;a<o;a++)s+="0";i=s+i;for(a=0;a<i.length-1;a+=7){var u=i.substr(a,7);a!=i.length-7&&(u="1"+u),n+=e(parseInt(u,2));}return n};if(!t.match(/^[0-9.]+$/))throw "malformed oid string: "+t;var n="",i=t.split("."),o=40*parseInt(i[0])+parseInt(i[1]);n+=e(o),i.splice(0,2);for(var s=0;s<i.length;s++)n+=r(i[s]);return n},Er.asn1.ASN1Object=function(){this.getLengthHexFromValue=function(){if(void 0===this.hV||null==this.hV)throw "this.hV is null or undefined.";if(this.hV.length%2==1)throw "value hex must be even length: n="+"".length+",v="+this.hV;var t=this.hV.length/2,e=t.toString(16);if(e.length%2==1&&(e="0"+e),t<128)return e;var r=e.length/2;if(r>15)throw "ASN.1 length too long to represent by 8x: n = "+t.toString(16);return (128+r).toString(16)+e},this.getEncodedHex=function(){return (null==this.hTLV||this.isModified)&&(this.hV=this.getFreshValueHex(),this.hL=this.getLengthHexFromValue(),this.hTLV=this.hT+this.hL+this.hV,this.isModified=!1),this.hTLV},this.getValueHex=function(){return this.getEncodedHex(),this.hV},this.getFreshValueHex=function(){return ""};},Er.asn1.DERAbstractString=function(t){Er.asn1.DERAbstractString.superclass.constructor.call(this);this.getString=function(){return this.s},this.setString=function(t){this.hTLV=null,this.isModified=!0,this.s=t,this.hV=Br(this.s).toLowerCase();},this.setStringHex=function(t){this.hTLV=null,this.isModified=!0,this.s=null,this.hV=t;},this.getFreshValueHex=function(){return this.hV},void 0!==t&&("string"==typeof t?this.setString(t):void 0!==t.str?this.setString(t.str):void 0!==t.hex&&this.setStringHex(t.hex));},o.lang.extend(Er.asn1.DERAbstractString,Er.asn1.ASN1Object),Er.asn1.DERAbstractTime=function(t){Er.asn1.DERAbstractTime.superclass.constructor.call(this);this.localDateToUTC=function(t){return utc=t.getTime()+6e4*t.getTimezoneOffset(),new Date(utc)},this.formatDate=function(t,e,r){var n=this.zeroPadding,i=this.localDateToUTC(t),o=String(i.getFullYear());"utc"==e&&(o=o.substr(2,2));var s=o+n(String(i.getMonth()+1),2)+n(String(i.getDate()),2)+n(String(i.getHours()),2)+n(String(i.getMinutes()),2)+n(String(i.getSeconds()),2);if(!0===r){var a=i.getMilliseconds();if(0!=a){var u=n(String(a),3);s=s+"."+(u=u.replace(/[0]+$/,""));}}return s+"Z"},this.zeroPadding=function(t,e){return t.length>=e?t:new Array(e-t.length+1).join("0")+t},this.getString=function(){return this.s},this.setString=function(t){this.hTLV=null,this.isModified=!0,this.s=t,this.hV=Rr(t);},this.setByDateValue=function(t,e,r,n,i,o){var s=new Date(Date.UTC(t,e-1,r,n,i,o,0));this.setByDate(s);},this.getFreshValueHex=function(){return this.hV};},o.lang.extend(Er.asn1.DERAbstractTime,Er.asn1.ASN1Object),Er.asn1.DERAbstractStructured=function(t){Er.asn1.DERAbstractString.superclass.constructor.call(this);this.setByASN1ObjectArray=function(t){this.hTLV=null,this.isModified=!0,this.asn1Array=t;},this.appendASN1Object=function(t){this.hTLV=null,this.isModified=!0,this.asn1Array.push(t);},this.asn1Array=new Array,void 0!==t&&void 0!==t.array&&(this.asn1Array=t.array);},o.lang.extend(Er.asn1.DERAbstractStructured,Er.asn1.ASN1Object),Er.asn1.DERBoolean=function(){Er.asn1.DERBoolean.superclass.constructor.call(this),this.hT="01",this.hTLV="0101ff";},o.lang.extend(Er.asn1.DERBoolean,Er.asn1.ASN1Object),Er.asn1.DERInteger=function(t){Er.asn1.DERInteger.superclass.constructor.call(this),this.hT="02",this.setByBigInteger=function(t){this.hTLV=null,this.isModified=!0,this.hV=Er.asn1.ASN1Util.bigIntToMinTwosComplementsHex(t);},this.setByInteger=function(t){var e=new E(String(t),10);this.setByBigInteger(e);},this.setValueHex=function(t){this.hV=t;},this.getFreshValueHex=function(){return this.hV},void 0!==t&&(void 0!==t.bigint?this.setByBigInteger(t.bigint):void 0!==t.int?this.setByInteger(t.int):"number"==typeof t?this.setByInteger(t):void 0!==t.hex&&this.setValueHex(t.hex));},o.lang.extend(Er.asn1.DERInteger,Er.asn1.ASN1Object),Er.asn1.DERBitString=function(t){if(void 0!==t&&void 0!==t.obj){var e=Er.asn1.ASN1Util.newObject(t.obj);t.hex="00"+e.getEncodedHex();}Er.asn1.DERBitString.superclass.constructor.call(this),this.hT="03",this.setHexValueIncludingUnusedBits=function(t){this.hTLV=null,this.isModified=!0,this.hV=t;},this.setUnusedBitsAndHexValue=function(t,e){if(t<0||7<t)throw "unused bits shall be from 0 to 7: u = "+t;var r="0"+t;this.hTLV=null,this.isModified=!0,this.hV=r+e;},this.setByBinaryString=function(t){var e=8-(t=t.replace(/0+$/,"")).length%8;8==e&&(e=0);for(var r=0;r<=e;r++)t+="0";var n="";for(r=0;r<t.length-1;r+=8){var i=t.substr(r,8),o=parseInt(i,2).toString(16);1==o.length&&(o="0"+o),n+=o;}this.hTLV=null,this.isModified=!0,this.hV="0"+e+n;},this.setByBooleanArray=function(t){for(var e="",r=0;r<t.length;r++)1==t[r]?e+="1":e+="0";this.setByBinaryString(e);},this.newFalseArray=function(t){for(var e=new Array(t),r=0;r<t;r++)e[r]=!1;return e},this.getFreshValueHex=function(){return this.hV},void 0!==t&&("string"==typeof t&&t.toLowerCase().match(/^[0-9a-f]+$/)?this.setHexValueIncludingUnusedBits(t):void 0!==t.hex?this.setHexValueIncludingUnusedBits(t.hex):void 0!==t.bin?this.setByBinaryString(t.bin):void 0!==t.array&&this.setByBooleanArray(t.array));},o.lang.extend(Er.asn1.DERBitString,Er.asn1.ASN1Object),Er.asn1.DEROctetString=function(t){if(void 0!==t&&void 0!==t.obj){var e=Er.asn1.ASN1Util.newObject(t.obj);t.hex=e.getEncodedHex();}Er.asn1.DEROctetString.superclass.constructor.call(this,t),this.hT="04";},o.lang.extend(Er.asn1.DEROctetString,Er.asn1.DERAbstractString),Er.asn1.DERNull=function(){Er.asn1.DERNull.superclass.constructor.call(this),this.hT="05",this.hTLV="0500";},o.lang.extend(Er.asn1.DERNull,Er.asn1.ASN1Object),Er.asn1.DERObjectIdentifier=function(t){var e=function t(e){var r=e.toString(16);return 1==r.length&&(r="0"+r),r},r=function t(r){var n="",i=new E(r,10).toString(2),o=7-i.length%7;7==o&&(o=0);for(var s="",a=0;a<o;a++)s+="0";i=s+i;for(a=0;a<i.length-1;a+=7){var u=i.substr(a,7);a!=i.length-7&&(u="1"+u),n+=e(parseInt(u,2));}return n};Er.asn1.DERObjectIdentifier.superclass.constructor.call(this),this.hT="06",this.setValueHex=function(t){this.hTLV=null,this.isModified=!0,this.s=null,this.hV=t;},this.setValueOidString=function(t){if(!t.match(/^[0-9.]+$/))throw "malformed oid string: "+t;var n="",i=t.split("."),o=40*parseInt(i[0])+parseInt(i[1]);n+=e(o),i.splice(0,2);for(var s=0;s<i.length;s++)n+=r(i[s]);this.hTLV=null,this.isModified=!0,this.s=null,this.hV=n;},this.setValueName=function(t){var e=Er.asn1.x509.OID.name2oid(t);if(""===e)throw "DERObjectIdentifier oidName undefined: "+t;this.setValueOidString(e);},this.getFreshValueHex=function(){return this.hV},void 0!==t&&("string"==typeof t?t.match(/^[0-2].[0-9.]+$/)?this.setValueOidString(t):this.setValueName(t):void 0!==t.oid?this.setValueOidString(t.oid):void 0!==t.hex?this.setValueHex(t.hex):void 0!==t.name&&this.setValueName(t.name));},o.lang.extend(Er.asn1.DERObjectIdentifier,Er.asn1.ASN1Object),Er.asn1.DEREnumerated=function(t){Er.asn1.DEREnumerated.superclass.constructor.call(this),this.hT="0a",this.setByBigInteger=function(t){this.hTLV=null,this.isModified=!0,this.hV=Er.asn1.ASN1Util.bigIntToMinTwosComplementsHex(t);},this.setByInteger=function(t){var e=new E(String(t),10);this.setByBigInteger(e);},this.setValueHex=function(t){this.hV=t;},this.getFreshValueHex=function(){return this.hV},void 0!==t&&(void 0!==t.int?this.setByInteger(t.int):"number"==typeof t?this.setByInteger(t):void 0!==t.hex&&this.setValueHex(t.hex));},o.lang.extend(Er.asn1.DEREnumerated,Er.asn1.ASN1Object),Er.asn1.DERUTF8String=function(t){Er.asn1.DERUTF8String.superclass.constructor.call(this,t),this.hT="0c";},o.lang.extend(Er.asn1.DERUTF8String,Er.asn1.DERAbstractString),Er.asn1.DERNumericString=function(t){Er.asn1.DERNumericString.superclass.constructor.call(this,t),this.hT="12";},o.lang.extend(Er.asn1.DERNumericString,Er.asn1.DERAbstractString),Er.asn1.DERPrintableString=function(t){Er.asn1.DERPrintableString.superclass.constructor.call(this,t),this.hT="13";},o.lang.extend(Er.asn1.DERPrintableString,Er.asn1.DERAbstractString),Er.asn1.DERTeletexString=function(t){Er.asn1.DERTeletexString.superclass.constructor.call(this,t),this.hT="14";},o.lang.extend(Er.asn1.DERTeletexString,Er.asn1.DERAbstractString),Er.asn1.DERIA5String=function(t){Er.asn1.DERIA5String.superclass.constructor.call(this,t),this.hT="16";},o.lang.extend(Er.asn1.DERIA5String,Er.asn1.DERAbstractString),Er.asn1.DERUTCTime=function(t){Er.asn1.DERUTCTime.superclass.constructor.call(this,t),this.hT="17",this.setByDate=function(t){this.hTLV=null,this.isModified=!0,this.date=t,this.s=this.formatDate(this.date,"utc"),this.hV=Rr(this.s);},this.getFreshValueHex=function(){return void 0===this.date&&void 0===this.s&&(this.date=new Date,this.s=this.formatDate(this.date,"utc"),this.hV=Rr(this.s)),this.hV},void 0!==t&&(void 0!==t.str?this.setString(t.str):"string"==typeof t&&t.match(/^[0-9]{12}Z$/)?this.setString(t):void 0!==t.hex?this.setStringHex(t.hex):void 0!==t.date&&this.setByDate(t.date));},o.lang.extend(Er.asn1.DERUTCTime,Er.asn1.DERAbstractTime),Er.asn1.DERGeneralizedTime=function(t){Er.asn1.DERGeneralizedTime.superclass.constructor.call(this,t),this.hT="18",this.withMillis=!1,this.setByDate=function(t){this.hTLV=null,this.isModified=!0,this.date=t,this.s=this.formatDate(this.date,"gen",this.withMillis),this.hV=Rr(this.s);},this.getFreshValueHex=function(){return void 0===this.date&&void 0===this.s&&(this.date=new Date,this.s=this.formatDate(this.date,"gen",this.withMillis),this.hV=Rr(this.s)),this.hV},void 0!==t&&(void 0!==t.str?this.setString(t.str):"string"==typeof t&&t.match(/^[0-9]{14}Z$/)?this.setString(t):void 0!==t.hex?this.setStringHex(t.hex):void 0!==t.date&&this.setByDate(t.date),!0===t.millis&&(this.withMillis=!0));},o.lang.extend(Er.asn1.DERGeneralizedTime,Er.asn1.DERAbstractTime),Er.asn1.DERSequence=function(t){Er.asn1.DERSequence.superclass.constructor.call(this,t),this.hT="30",this.getFreshValueHex=function(){for(var t="",e=0;e<this.asn1Array.length;e++){t+=this.asn1Array[e].getEncodedHex();}return this.hV=t,this.hV};},o.lang.extend(Er.asn1.DERSequence,Er.asn1.DERAbstractStructured),Er.asn1.DERSet=function(t){Er.asn1.DERSet.superclass.constructor.call(this,t),this.hT="31",this.sortFlag=!0,this.getFreshValueHex=function(){for(var t=new Array,e=0;e<this.asn1Array.length;e++){var r=this.asn1Array[e];t.push(r.getEncodedHex());}return 1==this.sortFlag&&t.sort(),this.hV=t.join(""),this.hV},void 0!==t&&void 0!==t.sortflag&&0==t.sortflag&&(this.sortFlag=!1);},o.lang.extend(Er.asn1.DERSet,Er.asn1.DERAbstractStructured),Er.asn1.DERTaggedObject=function(t){Er.asn1.DERTaggedObject.superclass.constructor.call(this),this.hT="a0",this.hV="",this.isExplicit=!0,this.asn1Object=null,this.setASN1Object=function(t,e,r){this.hT=e,this.isExplicit=t,this.asn1Object=r,this.isExplicit?(this.hV=this.asn1Object.getEncodedHex(),this.hTLV=null,this.isModified=!0):(this.hV=null,this.hTLV=r.getEncodedHex(),this.hTLV=this.hTLV.replace(/^../,e),this.isModified=!1);},this.getFreshValueHex=function(){return this.hV},void 0!==t&&(void 0!==t.tag&&(this.hT=t.tag),void 0!==t.explicit&&(this.isExplicit=t.explicit),void 0!==t.obj&&(this.asn1Object=t.obj,this.setASN1Object(this.isExplicit,this.hT,this.asn1Object)));},o.lang.extend(Er.asn1.DERTaggedObject,Er.asn1.ASN1Object);var Er,xr,kr,Ar=new function(){};function Pr(t){for(var e=new Array,r=0;r<t.length;r++)e[r]=t.charCodeAt(r);return e}function Cr(t){for(var e="",r=0;r<t.length;r++)e+=String.fromCharCode(t[r]);return e}function Tr(t){for(var e="",r=0;r<t.length;r++){var n=t[r].toString(16);1==n.length&&(n="0"+n),e+=n;}return e}function Rr(t){return Tr(Pr(t))}function Ir(t){return t=(t=(t=t.replace(/\=/g,"")).replace(/\+/g,"-")).replace(/\//g,"_")}function Dr(t){return t.length%4==2?t+="==":t.length%4==3&&(t+="="),t=(t=t.replace(/-/g,"+")).replace(/_/g,"/")}function Ur(t){return t.length%2==1&&(t="0"+t),Ir(F(t))}function Lr(t){return b(Dr(t))}function Br(t){return zr($r(t))}function Nr(t){return decodeURIComponent(Yr(t))}function Or(t){for(var e="",r=0;r<t.length-1;r+=2)e+=String.fromCharCode(parseInt(t.substr(r,2),16));return e}function jr(t){for(var e="",r=0;r<t.length;r++)e+=("0"+t.charCodeAt(r).toString(16)).slice(-2);return e}function Hr(t){return F(t)}function Mr(t){var e=Hr(t).replace(/(.{64})/g,"$1\r\n");return e=e.replace(/\r\n$/,"")}function Kr(t){return b(t.replace(/[^0-9A-Za-z\/+=]*/g,""))}function Vr(t,e){return "-----BEGIN "+e+"-----\r\n"+Mr(t)+"\r\n-----END "+e+"-----\r\n"}function qr(t,e){if(-1==t.indexOf("-----BEGIN "))throw "can't find PEM header: "+e;return Kr(t=void 0!==e?(t=t.replace("-----BEGIN "+e+"-----","")).replace("-----END "+e+"-----",""):(t=t.replace(/-----BEGIN [^-]+-----/,"")).replace(/-----END [^-]+-----/,""))}function Jr(t){var e,r,n,i,o,s,a,u,c,h,l;if(l=t.match(/^(\d{2}|\d{4})(\d\d)(\d\d)(\d\d)(\d\d)(\d\d)(|\.\d+)Z$/))return u=l[1],e=parseInt(u),2===u.length&&(50<=e&&e<100?e=1900+e:0<=e&&e<50&&(e=2e3+e)),r=parseInt(l[2])-1,n=parseInt(l[3]),i=parseInt(l[4]),o=parseInt(l[5]),s=parseInt(l[6]),a=0,""!==(c=l[7])&&(h=(c.substr(1)+"00").substr(0,3),a=parseInt(h)),Date.UTC(e,r,n,i,o,s,a);throw "unsupported zulu format: "+t}function Wr(t){return ~~(Jr(t)/1e3)}function zr(t){return t.replace(/%/g,"")}function Yr(t){return t.replace(/(..)/g,"%$1")}function Gr(t){var e="malformed IPv6 address";if(!t.match(/^[0-9A-Fa-f:]+$/))throw e;var r=(t=t.toLowerCase()).split(":").length-1;if(r<2)throw e;var n=":".repeat(7-r+2),i=(t=t.replace("::",n)).split(":");if(8!=i.length)throw e;for(var o=0;o<8;o++)i[o]=("0000"+i[o]).slice(-4);return i.join("")}function Xr(t){if(!t.match(/^[0-9A-Fa-f]{32}$/))throw "malformed IPv6 address octet";for(var e=(t=t.toLowerCase()).match(/.{1,4}/g),r=0;r<8;r++)e[r]=e[r].replace(/^0+/,""),""==e[r]&&(e[r]="0");var n=(t=":"+e.join(":")+":").match(/:(0:){2,}/g);if(null===n)return t.slice(1,-1);var i="";for(r=0;r<n.length;r++)n[r].length>i.length&&(i=n[r]);return (t=t.replace(i,"::")).slice(1,-1)}function Qr(t){var e="malformed hex value";if(!t.match(/^([0-9A-Fa-f][0-9A-Fa-f]){1,}$/))throw e;if(8!=t.length)return 32==t.length?Xr(t):t;try{return parseInt(t.substr(0,2),16)+"."+parseInt(t.substr(2,2),16)+"."+parseInt(t.substr(4,2),16)+"."+parseInt(t.substr(6,2),16)}catch(t){throw e}}function $r(t){for(var e=encodeURIComponent(t),r="",n=0;n<e.length;n++)"%"==e[n]?(r+=e.substr(n,3),n+=2):r=r+"%"+Rr(e[n]);return r}function Zr(t){return t.length%2==1?"0"+t:t.substr(0,1)>"7"?"00"+t:t}Ar.getLblen=function(t,e){if("8"!=t.substr(e+2,1))return 1;var r=parseInt(t.substr(e+3,1));return 0==r?-1:0<r&&r<10?r+1:-2},Ar.getL=function(t,e){var r=Ar.getLblen(t,e);return r<1?"":t.substr(e+2,2*r)},Ar.getVblen=function(t,e){var r;return ""==(r=Ar.getL(t,e))?-1:("8"===r.substr(0,1)?new E(r.substr(2),16):new E(r,16)).intValue()},Ar.getVidx=function(t,e){var r=Ar.getLblen(t,e);return r<0?r:e+2*(r+1)},Ar.getV=function(t,e){var r=Ar.getVidx(t,e),n=Ar.getVblen(t,e);return t.substr(r,2*n)},Ar.getTLV=function(t,e){return t.substr(e,2)+Ar.getL(t,e)+Ar.getV(t,e)},Ar.getNextSiblingIdx=function(t,e){return Ar.getVidx(t,e)+2*Ar.getVblen(t,e)},Ar.getChildIdx=function(t,e){var r=Ar,n=new Array,i=r.getVidx(t,e);"03"==t.substr(e,2)?n.push(i+2):n.push(i);for(var o=r.getVblen(t,e),s=i,a=0;;){var u=r.getNextSiblingIdx(t,s);if(null==u||u-i>=2*o)break;if(a>=200)break;n.push(u),s=u,a++;}return n},Ar.getNthChildIdx=function(t,e,r){return Ar.getChildIdx(t,e)[r]},Ar.getIdxbyList=function(t,e,r,n){var i,o,s=Ar;if(0==r.length){if(void 0!==n&&t.substr(e,2)!==n)throw "checking tag doesn't match: "+t.substr(e,2)+"!="+n;return e}return i=r.shift(),o=s.getChildIdx(t,e),s.getIdxbyList(t,o[i],r,n)},Ar.getTLVbyList=function(t,e,r,n){var i=Ar,o=i.getIdxbyList(t,e,r);if(void 0===o)throw "can't find nthList object";if(void 0!==n&&t.substr(o,2)!=n)throw "checking tag doesn't match: "+t.substr(o,2)+"!="+n;return i.getTLV(t,o)},Ar.getVbyList=function(t,e,r,n,i){var o,s,a=Ar;if(void 0===(o=a.getIdxbyList(t,e,r,n)))throw "can't find nthList object";return s=a.getV(t,o),!0===i&&(s=s.substr(2)),s},Ar.hextooidstr=function(t){var e=function t(e,r){return e.length>=r?e:new Array(r-e.length+1).join("0")+e},r=[],n=t.substr(0,2),i=parseInt(n,16);r[0]=new String(Math.floor(i/40)),r[1]=new String(i%40);for(var o=t.substr(2),s=[],a=0;a<o.length/2;a++)s.push(parseInt(o.substr(2*a,2),16));var u=[],c="";for(a=0;a<s.length;a++)128&s[a]?c+=e((127&s[a]).toString(2),7):(c+=e((127&s[a]).toString(2),7),u.push(new String(parseInt(c,2))),c="");var h=r.join(".");return u.length>0&&(h=h+"."+u.join(".")),h},Ar.dump=function(t,e,r,n){var i=Ar,o=i.getV,s=i.dump,a=i.getChildIdx,u=t;t instanceof Er.asn1.ASN1Object&&(u=t.getEncodedHex());var c=function t(e,r){return e.length<=2*r?e:e.substr(0,r)+"..(total "+e.length/2+"bytes).."+e.substr(e.length-r,r)};void 0===e&&(e={ommit_long_octet:32}),void 0===r&&(r=0),void 0===n&&(n="");var h=e.ommit_long_octet;if("01"==u.substr(r,2))return "00"==(l=o(u,r))?n+"BOOLEAN FALSE\n":n+"BOOLEAN TRUE\n";if("02"==u.substr(r,2))return n+"INTEGER "+c(l=o(u,r),h)+"\n";if("03"==u.substr(r,2))return n+"BITSTRING "+c(l=o(u,r),h)+"\n";if("04"==u.substr(r,2)){var l=o(u,r);if(i.isASN1HEX(l)){var f=n+"OCTETSTRING, encapsulates\n";return f+=s(l,e,0,n+"  ")}return n+"OCTETSTRING "+c(l,h)+"\n"}if("05"==u.substr(r,2))return n+"NULL\n";if("06"==u.substr(r,2)){var d=o(u,r),g=Er.asn1.ASN1Util.oidHexToInt(d),p=Er.asn1.x509.OID.oid2name(g),v=g.replace(/\./g," ");return ""!=p?n+"ObjectIdentifier "+p+" ("+v+")\n":n+"ObjectIdentifier ("+v+")\n"}if("0c"==u.substr(r,2))return n+"UTF8String '"+Nr(o(u,r))+"'\n";if("13"==u.substr(r,2))return n+"PrintableString '"+Nr(o(u,r))+"'\n";if("14"==u.substr(r,2))return n+"TeletexString '"+Nr(o(u,r))+"'\n";if("16"==u.substr(r,2))return n+"IA5String '"+Nr(o(u,r))+"'\n";if("17"==u.substr(r,2))return n+"UTCTime "+Nr(o(u,r))+"\n";if("18"==u.substr(r,2))return n+"GeneralizedTime "+Nr(o(u,r))+"\n";if("30"==u.substr(r,2)){if("3000"==u.substr(r,4))return n+"SEQUENCE {}\n";f=n+"SEQUENCE\n";var y=e;if((2==(S=a(u,r)).length||3==S.length)&&"06"==u.substr(S[0],2)&&"04"==u.substr(S[S.length-1],2)){p=i.oidname(o(u,S[0]));var m=JSON.parse(JSON.stringify(e));m.x509ExtName=p,y=m;}for(var _=0;_<S.length;_++)f+=s(u,y,S[_],n+"  ");return f}if("31"==u.substr(r,2)){f=n+"SET\n";var S=a(u,r);for(_=0;_<S.length;_++)f+=s(u,e,S[_],n+"  ");return f}var F=parseInt(u.substr(r,2),16);if(0!=(128&F)){var b=31&F;if(0!=(32&F)){var f=n+"["+b+"]\n";for(S=a(u,r),_=0;_<S.length;_++)f+=s(u,e,S[_],n+"  ");return f}return "68747470"==(l=o(u,r)).substr(0,8)&&(l=Nr(l)),"subjectAltName"===e.x509ExtName&&2==b&&(l=Nr(l)),f=n+"["+b+"] "+l+"\n"}return n+"UNKNOWN("+u.substr(r,2)+") "+o(u,r)+"\n"},Ar.isASN1HEX=function(t){var e=Ar;if(t.length%2==1)return !1;var r=e.getVblen(t,0),n=t.substr(0,2),i=e.getL(t,0);return t.length-n.length-i.length==2*r},Ar.oidname=function(t){var e=Er.asn1;Er.lang.String.isHex(t)&&(t=e.ASN1Util.oidHexToInt(t));var r=e.x509.OID.oid2name(t);return ""===r&&(r=t),r},void 0!==Er&&Er||(e.KJUR=Er={}),void 0!==Er.lang&&Er.lang||(Er.lang={}),Er.lang.String=function(){},"function"==typeof t?(e.utf8tob64u=xr=function e(r){return Ir(new t(r,"utf8").toString("base64"))},e.b64utoutf8=kr=function e(r){return new t(Dr(r),"base64").toString("utf8")}):(e.utf8tob64u=xr=function t(e){return Ur(zr($r(e)))},e.b64utoutf8=kr=function t(e){return decodeURIComponent(Yr(Lr(e)))}),Er.lang.String.isInteger=function(t){return !!t.match(/^[0-9]+$/)||!!t.match(/^-[0-9]+$/)},Er.lang.String.isHex=function(t){return !(t.length%2!=0||!t.match(/^[0-9a-f]+$/)&&!t.match(/^[0-9A-F]+$/))},Er.lang.String.isBase64=function(t){return !(!(t=t.replace(/\s+/g,"")).match(/^[0-9A-Za-z+\/]+={0,3}$/)||t.length%4!=0)},Er.lang.String.isBase64URL=function(t){return !t.match(/[+/=]/)&&(t=Dr(t),Er.lang.String.isBase64(t))},Er.lang.String.isIntegerArray=function(t){return !!(t=t.replace(/\s+/g,"")).match(/^\[[0-9,]+\]$/)};void 0!==Er&&Er||(e.KJUR=Er={}),void 0!==Er.crypto&&Er.crypto||(Er.crypto={}),Er.crypto.Util=new function(){this.DIGESTINFOHEAD={sha1:"3021300906052b0e03021a05000414",sha224:"302d300d06096086480165030402040500041c",sha256:"3031300d060960864801650304020105000420",sha384:"3041300d060960864801650304020205000430",sha512:"3051300d060960864801650304020305000440",md2:"3020300c06082a864886f70d020205000410",md5:"3020300c06082a864886f70d020505000410",ripemd160:"3021300906052b2403020105000414"},this.DEFAULTPROVIDER={md5:"cryptojs",sha1:"cryptojs",sha224:"cryptojs",sha256:"cryptojs",sha384:"cryptojs",sha512:"cryptojs",ripemd160:"cryptojs",hmacmd5:"cryptojs",hmacsha1:"cryptojs",hmacsha224:"cryptojs",hmacsha256:"cryptojs",hmacsha384:"cryptojs",hmacsha512:"cryptojs",hmacripemd160:"cryptojs",MD5withRSA:"cryptojs/jsrsa",SHA1withRSA:"cryptojs/jsrsa",SHA224withRSA:"cryptojs/jsrsa",SHA256withRSA:"cryptojs/jsrsa",SHA384withRSA:"cryptojs/jsrsa",SHA512withRSA:"cryptojs/jsrsa",RIPEMD160withRSA:"cryptojs/jsrsa",MD5withECDSA:"cryptojs/jsrsa",SHA1withECDSA:"cryptojs/jsrsa",SHA224withECDSA:"cryptojs/jsrsa",SHA256withECDSA:"cryptojs/jsrsa",SHA384withECDSA:"cryptojs/jsrsa",SHA512withECDSA:"cryptojs/jsrsa",RIPEMD160withECDSA:"cryptojs/jsrsa",SHA1withDSA:"cryptojs/jsrsa",SHA224withDSA:"cryptojs/jsrsa",SHA256withDSA:"cryptojs/jsrsa",MD5withRSAandMGF1:"cryptojs/jsrsa",SHA1withRSAandMGF1:"cryptojs/jsrsa",SHA224withRSAandMGF1:"cryptojs/jsrsa",SHA256withRSAandMGF1:"cryptojs/jsrsa",SHA384withRSAandMGF1:"cryptojs/jsrsa",SHA512withRSAandMGF1:"cryptojs/jsrsa",RIPEMD160withRSAandMGF1:"cryptojs/jsrsa"},this.CRYPTOJSMESSAGEDIGESTNAME={md5:y.algo.MD5,sha1:y.algo.SHA1,sha224:y.algo.SHA224,sha256:y.algo.SHA256,sha384:y.algo.SHA384,sha512:y.algo.SHA512,ripemd160:y.algo.RIPEMD160},this.getDigestInfoHex=function(t,e){if(void 0===this.DIGESTINFOHEAD[e])throw "alg not supported in Util.DIGESTINFOHEAD: "+e;return this.DIGESTINFOHEAD[e]+t},this.getPaddedDigestInfoHex=function(t,e,r){var n=this.getDigestInfoHex(t,e),i=r/4;if(n.length+22>i)throw "key is too short for SigAlg: keylen="+r+","+e;for(var o="0001",s="00"+n,a="",u=i-o.length-s.length,c=0;c<u;c+=2)a+="ff";return o+a+s},this.hashString=function(t,e){return new Er.crypto.MessageDigest({alg:e}).digestString(t)},this.hashHex=function(t,e){return new Er.crypto.MessageDigest({alg:e}).digestHex(t)},this.sha1=function(t){return new Er.crypto.MessageDigest({alg:"sha1",prov:"cryptojs"}).digestString(t)},this.sha256=function(t){return new Er.crypto.MessageDigest({alg:"sha256",prov:"cryptojs"}).digestString(t)},this.sha256Hex=function(t){return new Er.crypto.MessageDigest({alg:"sha256",prov:"cryptojs"}).digestHex(t)},this.sha512=function(t){return new Er.crypto.MessageDigest({alg:"sha512",prov:"cryptojs"}).digestString(t)},this.sha512Hex=function(t){return new Er.crypto.MessageDigest({alg:"sha512",prov:"cryptojs"}).digestHex(t)};},Er.crypto.Util.md5=function(t){return new Er.crypto.MessageDigest({alg:"md5",prov:"cryptojs"}).digestString(t)},Er.crypto.Util.ripemd160=function(t){return new Er.crypto.MessageDigest({alg:"ripemd160",prov:"cryptojs"}).digestString(t)},Er.crypto.Util.SECURERANDOMGEN=new Me,Er.crypto.Util.getRandomHexOfNbytes=function(t){var e=new Array(t);return Er.crypto.Util.SECURERANDOMGEN.nextBytes(e),Tr(e)},Er.crypto.Util.getRandomBigIntegerOfNbytes=function(t){return new E(Er.crypto.Util.getRandomHexOfNbytes(t),16)},Er.crypto.Util.getRandomHexOfNbits=function(t){var e=t%8,r=new Array((t-e)/8+1);return Er.crypto.Util.SECURERANDOMGEN.nextBytes(r),r[0]=(255<<e&255^255)&r[0],Tr(r)},Er.crypto.Util.getRandomBigIntegerOfNbits=function(t){return new E(Er.crypto.Util.getRandomHexOfNbits(t),16)},Er.crypto.Util.getRandomBigIntegerZeroToMax=function(t){for(var e=t.bitLength();;){var r=Er.crypto.Util.getRandomBigIntegerOfNbits(e);if(-1!=t.compareTo(r))return r}},Er.crypto.Util.getRandomBigIntegerMinToMax=function(t,e){var r=t.compareTo(e);if(1==r)throw "biMin is greater than biMax";if(0==r)return t;var n=e.subtract(t);return Er.crypto.Util.getRandomBigIntegerZeroToMax(n).add(t)},Er.crypto.MessageDigest=function(t){this.setAlgAndProvider=function(t,e){if(null!==(t=Er.crypto.MessageDigest.getCanonicalAlgName(t))&&void 0===e&&(e=Er.crypto.Util.DEFAULTPROVIDER[t]),-1!=":md5:sha1:sha224:sha256:sha384:sha512:ripemd160:".indexOf(t)&&"cryptojs"==e){try{this.md=Er.crypto.Util.CRYPTOJSMESSAGEDIGESTNAME[t].create();}catch(e){throw "setAlgAndProvider hash alg set fail alg="+t+"/"+e}this.updateString=function(t){this.md.update(t);},this.updateHex=function(t){var e=y.enc.Hex.parse(t);this.md.update(e);},this.digest=function(){return this.md.finalize().toString(y.enc.Hex)},this.digestString=function(t){return this.updateString(t),this.digest()},this.digestHex=function(t){return this.updateHex(t),this.digest()};}if(-1!=":sha256:".indexOf(t)&&"sjcl"==e){try{this.md=new sjcl.hash.sha256;}catch(e){throw "setAlgAndProvider hash alg set fail alg="+t+"/"+e}this.updateString=function(t){this.md.update(t);},this.updateHex=function(t){var e=sjcl.codec.hex.toBits(t);this.md.update(e);},this.digest=function(){var t=this.md.finalize();return sjcl.codec.hex.fromBits(t)},this.digestString=function(t){return this.updateString(t),this.digest()},this.digestHex=function(t){return this.updateHex(t),this.digest()};}},this.updateString=function(t){throw "updateString(str) not supported for this alg/prov: "+this.algName+"/"+this.provName},this.updateHex=function(t){throw "updateHex(hex) not supported for this alg/prov: "+this.algName+"/"+this.provName},this.digest=function(){throw "digest() not supported for this alg/prov: "+this.algName+"/"+this.provName},this.digestString=function(t){throw "digestString(str) not supported for this alg/prov: "+this.algName+"/"+this.provName},this.digestHex=function(t){throw "digestHex(hex) not supported for this alg/prov: "+this.algName+"/"+this.provName},void 0!==t&&void 0!==t.alg&&(this.algName=t.alg,void 0===t.prov&&(this.provName=Er.crypto.Util.DEFAULTPROVIDER[this.algName]),this.setAlgAndProvider(this.algName,this.provName));},Er.crypto.MessageDigest.getCanonicalAlgName=function(t){return "string"==typeof t&&(t=(t=t.toLowerCase()).replace(/-/,"")),t},Er.crypto.MessageDigest.getHashLength=function(t){var e=Er.crypto.MessageDigest,r=e.getCanonicalAlgName(t);if(void 0===e.HASHLENGTH[r])throw "not supported algorithm: "+t;return e.HASHLENGTH[r]},Er.crypto.MessageDigest.HASHLENGTH={md5:16,sha1:20,sha224:28,sha256:32,sha384:48,sha512:64,ripemd160:20},Er.crypto.Mac=function(t){this.setAlgAndProvider=function(t,e){if(null==(t=t.toLowerCase())&&(t="hmacsha1"),"hmac"!=(t=t.toLowerCase()).substr(0,4))throw "setAlgAndProvider unsupported HMAC alg: "+t;void 0===e&&(e=Er.crypto.Util.DEFAULTPROVIDER[t]),this.algProv=t+"/"+e;var r=t.substr(4);if(-1!=":md5:sha1:sha224:sha256:sha384:sha512:ripemd160:".indexOf(r)&&"cryptojs"==e){try{var n=Er.crypto.Util.CRYPTOJSMESSAGEDIGESTNAME[r];this.mac=y.algo.HMAC.create(n,this.pass);}catch(t){throw "setAlgAndProvider hash alg set fail hashAlg="+r+"/"+t}this.updateString=function(t){this.mac.update(t);},this.updateHex=function(t){var e=y.enc.Hex.parse(t);this.mac.update(e);},this.doFinal=function(){return this.mac.finalize().toString(y.enc.Hex)},this.doFinalString=function(t){return this.updateString(t),this.doFinal()},this.doFinalHex=function(t){return this.updateHex(t),this.doFinal()};}},this.updateString=function(t){throw "updateString(str) not supported for this alg/prov: "+this.algProv},this.updateHex=function(t){throw "updateHex(hex) not supported for this alg/prov: "+this.algProv},this.doFinal=function(){throw "digest() not supported for this alg/prov: "+this.algProv},this.doFinalString=function(t){throw "digestString(str) not supported for this alg/prov: "+this.algProv},this.doFinalHex=function(t){throw "digestHex(hex) not supported for this alg/prov: "+this.algProv},this.setPassword=function(t){if("string"==typeof t){var e=t;return t.length%2!=1&&t.match(/^[0-9A-Fa-f]+$/)||(e=jr(t)),void(this.pass=y.enc.Hex.parse(e))}if("object"!=(void 0===t?"undefined":r(t)))throw "KJUR.crypto.Mac unsupported password type: "+t;e=null;if(void 0!==t.hex){if(t.hex.length%2!=0||!t.hex.match(/^[0-9A-Fa-f]+$/))throw "Mac: wrong hex password: "+t.hex;e=t.hex;}if(void 0!==t.utf8&&(e=Br(t.utf8)),void 0!==t.rstr&&(e=jr(t.rstr)),void 0!==t.b64&&(e=b(t.b64)),void 0!==t.b64u&&(e=Lr(t.b64u)),null==e)throw "KJUR.crypto.Mac unsupported password type: "+t;this.pass=y.enc.Hex.parse(e);},void 0!==t&&(void 0!==t.pass&&this.setPassword(t.pass),void 0!==t.alg&&(this.algName=t.alg,void 0===t.prov&&(this.provName=Er.crypto.Util.DEFAULTPROVIDER[this.algName]),this.setAlgAndProvider(this.algName,this.provName)));},Er.crypto.Signature=function(t){var e=null;if(this._setAlgNames=function(){var t=this.algName.match(/^(.+)with(.+)$/);t&&(this.mdAlgName=t[1].toLowerCase(),this.pubkeyAlgName=t[2].toLowerCase());},this._zeroPaddingOfSignature=function(t,e){for(var r="",n=e/4-t.length,i=0;i<n;i++)r+="0";return r+t},this.setAlgAndProvider=function(t,e){if(this._setAlgNames(),"cryptojs/jsrsa"!=e)throw "provider not supported: "+e;if(-1!=":md5:sha1:sha224:sha256:sha384:sha512:ripemd160:".indexOf(this.mdAlgName)){try{this.md=new Er.crypto.MessageDigest({alg:this.mdAlgName});}catch(t){throw "setAlgAndProvider hash alg set fail alg="+this.mdAlgName+"/"+t}this.init=function(t,e){var r=null;try{r=void 0===e?tn.getKey(t):tn.getKey(t,e);}catch(t){throw "init failed:"+t}if(!0===r.isPrivate)this.prvKey=r,this.state="SIGN";else {if(!0!==r.isPublic)throw "init failed.:"+r;this.pubKey=r,this.state="VERIFY";}},this.updateString=function(t){this.md.updateString(t);},this.updateHex=function(t){this.md.updateHex(t);},this.sign=function(){if(this.sHashHex=this.md.digest(),void 0!==this.ecprvhex&&void 0!==this.eccurvename){var t=new Er.crypto.ECDSA({curve:this.eccurvename});this.hSign=t.signHex(this.sHashHex,this.ecprvhex);}else if(this.prvKey instanceof qe&&"rsaandmgf1"===this.pubkeyAlgName)this.hSign=this.prvKey.signWithMessageHashPSS(this.sHashHex,this.mdAlgName,this.pssSaltLen);else if(this.prvKey instanceof qe&&"rsa"===this.pubkeyAlgName)this.hSign=this.prvKey.signWithMessageHash(this.sHashHex,this.mdAlgName);else if(this.prvKey instanceof Er.crypto.ECDSA)this.hSign=this.prvKey.signWithMessageHash(this.sHashHex);else {if(!(this.prvKey instanceof Er.crypto.DSA))throw "Signature: unsupported private key alg: "+this.pubkeyAlgName;this.hSign=this.prvKey.signWithMessageHash(this.sHashHex);}return this.hSign},this.signString=function(t){return this.updateString(t),this.sign()},this.signHex=function(t){return this.updateHex(t),this.sign()},this.verify=function(t){if(this.sHashHex=this.md.digest(),void 0!==this.ecpubhex&&void 0!==this.eccurvename)return new Er.crypto.ECDSA({curve:this.eccurvename}).verifyHex(this.sHashHex,t,this.ecpubhex);if(this.pubKey instanceof qe&&"rsaandmgf1"===this.pubkeyAlgName)return this.pubKey.verifyWithMessageHashPSS(this.sHashHex,t,this.mdAlgName,this.pssSaltLen);if(this.pubKey instanceof qe&&"rsa"===this.pubkeyAlgName)return this.pubKey.verifyWithMessageHash(this.sHashHex,t);if(void 0!==Er.crypto.ECDSA&&this.pubKey instanceof Er.crypto.ECDSA)return this.pubKey.verifyWithMessageHash(this.sHashHex,t);if(void 0!==Er.crypto.DSA&&this.pubKey instanceof Er.crypto.DSA)return this.pubKey.verifyWithMessageHash(this.sHashHex,t);throw "Signature: unsupported public key alg: "+this.pubkeyAlgName};}},this.init=function(t,e){throw "init(key, pass) not supported for this alg:prov="+this.algProvName},this.updateString=function(t){throw "updateString(str) not supported for this alg:prov="+this.algProvName},this.updateHex=function(t){throw "updateHex(hex) not supported for this alg:prov="+this.algProvName},this.sign=function(){throw "sign() not supported for this alg:prov="+this.algProvName},this.signString=function(t){throw "digestString(str) not supported for this alg:prov="+this.algProvName},this.signHex=function(t){throw "digestHex(hex) not supported for this alg:prov="+this.algProvName},this.verify=function(t){throw "verify(hSigVal) not supported for this alg:prov="+this.algProvName},this.initParams=t,void 0!==t&&(void 0!==t.alg&&(this.algName=t.alg,void 0===t.prov?this.provName=Er.crypto.Util.DEFAULTPROVIDER[this.algName]:this.provName=t.prov,this.algProvName=this.algName+":"+this.provName,this.setAlgAndProvider(this.algName,this.provName),this._setAlgNames()),void 0!==t.psssaltlen&&(this.pssSaltLen=t.psssaltlen),void 0!==t.prvkeypem)){if(void 0!==t.prvkeypas)throw "both prvkeypem and prvkeypas parameters not supported";try{e=tn.getKey(t.prvkeypem);this.init(e);}catch(t){throw "fatal error to load pem private key: "+t}}},Er.crypto.Cipher=function(t){},Er.crypto.Cipher.encrypt=function(t,e,r){if(e instanceof qe&&e.isPublic){var n=Er.crypto.Cipher.getAlgByKeyAndName(e,r);if("RSA"===n)return e.encrypt(t);if("RSAOAEP"===n)return e.encryptOAEP(t,"sha1");var i=n.match(/^RSAOAEP(\d+)$/);if(null!==i)return e.encryptOAEP(t,"sha"+i[1]);throw "Cipher.encrypt: unsupported algorithm for RSAKey: "+r}throw "Cipher.encrypt: unsupported key or algorithm"},Er.crypto.Cipher.decrypt=function(t,e,r){if(e instanceof qe&&e.isPrivate){var n=Er.crypto.Cipher.getAlgByKeyAndName(e,r);if("RSA"===n)return e.decrypt(t);if("RSAOAEP"===n)return e.decryptOAEP(t,"sha1");var i=n.match(/^RSAOAEP(\d+)$/);if(null!==i)return e.decryptOAEP(t,"sha"+i[1]);throw "Cipher.decrypt: unsupported algorithm for RSAKey: "+r}throw "Cipher.decrypt: unsupported key or algorithm"},Er.crypto.Cipher.getAlgByKeyAndName=function(t,e){if(t instanceof qe){if(-1!=":RSA:RSAOAEP:RSAOAEP224:RSAOAEP256:RSAOAEP384:RSAOAEP512:".indexOf(e))return e;if(null===e||void 0===e)return "RSA";throw "getAlgByKeyAndName: not supported algorithm name for RSAKey: "+e}throw "getAlgByKeyAndName: not supported algorithm name: "+e},Er.crypto.OID=new function(){this.oidhex2name={"2a864886f70d010101":"rsaEncryption","2a8648ce3d0201":"ecPublicKey","2a8648ce380401":"dsa","2a8648ce3d030107":"secp256r1","2b8104001f":"secp192k1","2b81040021":"secp224r1","2b8104000a":"secp256k1","2b81040023":"secp521r1","2b81040022":"secp384r1","2a8648ce380403":"SHA1withDSA","608648016503040301":"SHA224withDSA","608648016503040302":"SHA256withDSA"};},void 0!==Er&&Er||(e.KJUR=Er={}),void 0!==Er.crypto&&Er.crypto||(Er.crypto={}),Er.crypto.ECDSA=function(t){var e=new Me;this.type="EC",this.isPrivate=!1,this.isPublic=!1,this.getBigRandom=function(t){return new E(t.bitLength(),e).mod(t.subtract(E.ONE)).add(E.ONE)},this.setNamedCurve=function(t){this.ecparams=Er.crypto.ECParameterDB.getByName(t),this.prvKeyHex=null,this.pubKeyHex=null,this.curveName=t;},this.setPrivateKeyHex=function(t){this.isPrivate=!0,this.prvKeyHex=t;},this.setPublicKeyHex=function(t){this.isPublic=!0,this.pubKeyHex=t;},this.getPublicKeyXYHex=function(){var t=this.pubKeyHex;if("04"!==t.substr(0,2))throw "this method supports uncompressed format(04) only";var e=this.ecparams.keylen/4;if(t.length!==2+2*e)throw "malformed public key hex length";var r={};return r.x=t.substr(2,e),r.y=t.substr(2+e),r},this.getShortNISTPCurveName=function(){var t=this.curveName;return "secp256r1"===t||"NIST P-256"===t||"P-256"===t||"prime256v1"===t?"P-256":"secp384r1"===t||"NIST P-384"===t||"P-384"===t?"P-384":null},this.generateKeyPairHex=function(){var t=this.ecparams.n,e=this.getBigRandom(t),r=this.ecparams.G.multiply(e),n=r.getX().toBigInteger(),i=r.getY().toBigInteger(),o=this.ecparams.keylen/4,s=("0000000000"+e.toString(16)).slice(-o),a="04"+("0000000000"+n.toString(16)).slice(-o)+("0000000000"+i.toString(16)).slice(-o);return this.setPrivateKeyHex(s),this.setPublicKeyHex(a),{ecprvhex:s,ecpubhex:a}},this.signWithMessageHash=function(t){return this.signHex(t,this.prvKeyHex)},this.signHex=function(t,e){var r=new E(e,16),n=this.ecparams.n,i=new E(t,16);do{var o=this.getBigRandom(n),s=this.ecparams.G.multiply(o).getX().toBigInteger().mod(n);}while(s.compareTo(E.ZERO)<=0);var a=o.modInverse(n).multiply(i.add(r.multiply(s))).mod(n);return Er.crypto.ECDSA.biRSSigToASN1Sig(s,a)},this.sign=function(t,e){var r=e,n=this.ecparams.n,i=E.fromByteArrayUnsigned(t);do{var o=this.getBigRandom(n),s=this.ecparams.G.multiply(o).getX().toBigInteger().mod(n);}while(s.compareTo(E.ZERO)<=0);var a=o.modInverse(n).multiply(i.add(r.multiply(s))).mod(n);return this.serializeSig(s,a)},this.verifyWithMessageHash=function(t,e){return this.verifyHex(t,e,this.pubKeyHex)},this.verifyHex=function(t,e,r){var n,i,o,s=Er.crypto.ECDSA.parseSigHex(e);n=s.r,i=s.s,o=We.decodeFromHex(this.ecparams.curve,r);var a=new E(t,16);return this.verifyRaw(a,n,i,o)},this.verify=function(t,e,n){var i,o,s;if(Bitcoin.Util.isArray(e)){var a=this.parseSig(e);i=a.r,o=a.s;}else {if("object"!==(void 0===e?"undefined":r(e))||!e.r||!e.s)throw "Invalid value for signature";i=e.r,o=e.s;}if(n instanceof We)s=n;else {if(!Bitcoin.Util.isArray(n))throw "Invalid format for pubkey value, must be byte array or ECPointFp";s=We.decodeFrom(this.ecparams.curve,n);}var u=E.fromByteArrayUnsigned(t);return this.verifyRaw(u,i,o,s)},this.verifyRaw=function(t,e,r,n){var i=this.ecparams.n,o=this.ecparams.G;if(e.compareTo(E.ONE)<0||e.compareTo(i)>=0)return !1;if(r.compareTo(E.ONE)<0||r.compareTo(i)>=0)return !1;var s=r.modInverse(i),a=t.multiply(s).mod(i),u=e.multiply(s).mod(i);return o.multiply(a).add(n.multiply(u)).getX().toBigInteger().mod(i).equals(e)},this.serializeSig=function(t,e){var r=t.toByteArraySigned(),n=e.toByteArraySigned(),i=[];return i.push(2),i.push(r.length),(i=i.concat(r)).push(2),i.push(n.length),(i=i.concat(n)).unshift(i.length),i.unshift(48),i},this.parseSig=function(t){var e;if(48!=t[0])throw new Error("Signature not a valid DERSequence");if(2!=t[e=2])throw new Error("First element in signature must be a DERInteger");var r=t.slice(e+2,e+2+t[e+1]);if(2!=t[e+=2+t[e+1]])throw new Error("Second element in signature must be a DERInteger");var n=t.slice(e+2,e+2+t[e+1]);return e+=2+t[e+1],{r:E.fromByteArrayUnsigned(r),s:E.fromByteArrayUnsigned(n)}},this.parseSigCompact=function(t){if(65!==t.length)throw "Signature has the wrong length";var e=t[0]-27;if(e<0||e>7)throw "Invalid signature type";var r=this.ecparams.n;return {r:E.fromByteArrayUnsigned(t.slice(1,33)).mod(r),s:E.fromByteArrayUnsigned(t.slice(33,65)).mod(r),i:e}},this.readPKCS5PrvKeyHex=function(t){var e,r,n,i=Ar,o=Er.crypto.ECDSA.getName,s=i.getVbyList;if(!1===i.isASN1HEX(t))throw "not ASN.1 hex string";try{e=s(t,0,[2,0],"06"),r=s(t,0,[1],"04");try{n=s(t,0,[3,0],"03").substr(2);}catch(t){}}catch(t){throw "malformed PKCS#1/5 plain ECC private key"}if(this.curveName=o(e),void 0===this.curveName)throw "unsupported curve name";this.setNamedCurve(this.curveName),this.setPublicKeyHex(n),this.setPrivateKeyHex(r),this.isPublic=!1;},this.readPKCS8PrvKeyHex=function(t){var e,r,n,i=Ar,o=Er.crypto.ECDSA.getName,s=i.getVbyList;if(!1===i.isASN1HEX(t))throw "not ASN.1 hex string";try{s(t,0,[1,0],"06"),e=s(t,0,[1,1],"06"),r=s(t,0,[2,0,1],"04");try{n=s(t,0,[2,0,2,0],"03").substr(2);}catch(t){}}catch(t){throw "malformed PKCS#8 plain ECC private key"}if(this.curveName=o(e),void 0===this.curveName)throw "unsupported curve name";this.setNamedCurve(this.curveName),this.setPublicKeyHex(n),this.setPrivateKeyHex(r),this.isPublic=!1;},this.readPKCS8PubKeyHex=function(t){var e,r,n=Ar,i=Er.crypto.ECDSA.getName,o=n.getVbyList;if(!1===n.isASN1HEX(t))throw "not ASN.1 hex string";try{o(t,0,[0,0],"06"),e=o(t,0,[0,1],"06"),r=o(t,0,[1],"03").substr(2);}catch(t){throw "malformed PKCS#8 ECC public key"}if(this.curveName=i(e),null===this.curveName)throw "unsupported curve name";this.setNamedCurve(this.curveName),this.setPublicKeyHex(r);},this.readCertPubKeyHex=function(t,e){5!==e&&(e=6);var r,n,i=Ar,o=Er.crypto.ECDSA.getName,s=i.getVbyList;if(!1===i.isASN1HEX(t))throw "not ASN.1 hex string";try{r=s(t,0,[0,e,0,1],"06"),n=s(t,0,[0,e,1],"03").substr(2);}catch(t){throw "malformed X.509 certificate ECC public key"}if(this.curveName=o(r),null===this.curveName)throw "unsupported curve name";this.setNamedCurve(this.curveName),this.setPublicKeyHex(n);},void 0!==t&&void 0!==t.curve&&(this.curveName=t.curve),void 0===this.curveName&&(this.curveName="secp256r1"),this.setNamedCurve(this.curveName),void 0!==t&&(void 0!==t.prv&&this.setPrivateKeyHex(t.prv),void 0!==t.pub&&this.setPublicKeyHex(t.pub));},Er.crypto.ECDSA.parseSigHex=function(t){var e=Er.crypto.ECDSA.parseSigHexInHexRS(t);return {r:new E(e.r,16),s:new E(e.s,16)}},Er.crypto.ECDSA.parseSigHexInHexRS=function(t){var e=Ar,r=e.getChildIdx,n=e.getV;if("30"!=t.substr(0,2))throw "signature is not a ASN.1 sequence";var i=r(t,0);if(2!=i.length)throw "number of signature ASN.1 sequence elements seem wrong";var o=i[0],s=i[1];if("02"!=t.substr(o,2))throw "1st item of sequene of signature is not ASN.1 integer";if("02"!=t.substr(s,2))throw "2nd item of sequene of signature is not ASN.1 integer";return {r:n(t,o),s:n(t,s)}},Er.crypto.ECDSA.asn1SigToConcatSig=function(t){var e=Er.crypto.ECDSA.parseSigHexInHexRS(t),r=e.r,n=e.s;if("00"==r.substr(0,2)&&r.length%32==2&&(r=r.substr(2)),"00"==n.substr(0,2)&&n.length%32==2&&(n=n.substr(2)),r.length%32==30&&(r="00"+r),n.length%32==30&&(n="00"+n),r.length%32!=0)throw "unknown ECDSA sig r length error";if(n.length%32!=0)throw "unknown ECDSA sig s length error";return r+n},Er.crypto.ECDSA.concatSigToASN1Sig=function(t){if(t.length/2*8%128!=0)throw "unknown ECDSA concatinated r-s sig  length error";var e=t.substr(0,t.length/2),r=t.substr(t.length/2);return Er.crypto.ECDSA.hexRSSigToASN1Sig(e,r)},Er.crypto.ECDSA.hexRSSigToASN1Sig=function(t,e){var r=new E(t,16),n=new E(e,16);return Er.crypto.ECDSA.biRSSigToASN1Sig(r,n)},Er.crypto.ECDSA.biRSSigToASN1Sig=function(t,e){var r=Er.asn1,n=new r.DERInteger({bigint:t}),i=new r.DERInteger({bigint:e});return new r.DERSequence({array:[n,i]}).getEncodedHex()},Er.crypto.ECDSA.getName=function(t){return "2a8648ce3d030107"===t?"secp256r1":"2b8104000a"===t?"secp256k1":"2b81040022"===t?"secp384r1":-1!=="|secp256r1|NIST P-256|P-256|prime256v1|".indexOf(t)?"secp256r1":-1!=="|secp256k1|".indexOf(t)?"secp256k1":-1!=="|secp384r1|NIST P-384|P-384|".indexOf(t)?"secp384r1":null},void 0!==Er&&Er||(e.KJUR=Er={}),void 0!==Er.crypto&&Er.crypto||(Er.crypto={}),Er.crypto.ECParameterDB=new function(){var t={},e={};function r(t){return new E(t,16)}this.getByName=function(r){var n=r;if(void 0!==e[n]&&(n=e[r]),void 0!==t[n])return t[n];throw "unregistered EC curve name: "+n},this.regist=function(n,i,o,s,a,u,c,h,l,f,d,g){t[n]={};var p=r(o),v=r(s),y=r(a),m=r(u),_=r(c),S=new ze(p,v,y),F=S.decodePointHex("04"+h+l);t[n].name=n,t[n].keylen=i,t[n].curve=S,t[n].G=F,t[n].n=m,t[n].h=_,t[n].oid=d,t[n].info=g;for(var b=0;b<f.length;b++)e[f[b]]=n;};},Er.crypto.ECParameterDB.regist("secp128r1",128,"FFFFFFFDFFFFFFFFFFFFFFFFFFFFFFFF","FFFFFFFDFFFFFFFFFFFFFFFFFFFFFFFC","E87579C11079F43DD824993C2CEE5ED3","FFFFFFFE0000000075A30D1B9038A115","1","161FF7528B899B2D0C28607CA52C5B86","CF5AC8395BAFEB13C02DA292DDED7A83",[],"","secp128r1 : SECG curve over a 128 bit prime field"),Er.crypto.ECParameterDB.regist("secp160k1",160,"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFAC73","0","7","0100000000000000000001B8FA16DFAB9ACA16B6B3","1","3B4C382CE37AA192A4019E763036F4F5DD4D7EBB","938CF935318FDCED6BC28286531733C3F03C4FEE",[],"","secp160k1 : SECG curve over a 160 bit prime field"),Er.crypto.ECParameterDB.regist("secp160r1",160,"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF7FFFFFFF","FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF7FFFFFFC","1C97BEFC54BD7A8B65ACF89F81D4D4ADC565FA45","0100000000000000000001F4C8F927AED3CA752257","1","4A96B5688EF573284664698968C38BB913CBFC82","23A628553168947D59DCC912042351377AC5FB32",[],"","secp160r1 : SECG curve over a 160 bit prime field"),Er.crypto.ECParameterDB.regist("secp192k1",192,"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFEE37","0","3","FFFFFFFFFFFFFFFFFFFFFFFE26F2FC170F69466A74DEFD8D","1","DB4FF10EC057E9AE26B07D0280B7F4341DA5D1B1EAE06C7D","9B2F2F6D9C5628A7844163D015BE86344082AA88D95E2F9D",[]),Er.crypto.ECParameterDB.regist("secp192r1",192,"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFC","64210519E59C80E70FA7E9AB72243049FEB8DEECC146B9B1","FFFFFFFFFFFFFFFFFFFFFFFF99DEF836146BC9B1B4D22831","1","188DA80EB03090F67CBF20EB43A18800F4FF0AFD82FF1012","07192B95FFC8DA78631011ED6B24CDD573F977A11E794811",[]),Er.crypto.ECParameterDB.regist("secp224r1",224,"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF000000000000000000000001","FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFE","B4050A850C04B3ABF54132565044B0B7D7BFD8BA270B39432355FFB4","FFFFFFFFFFFFFFFFFFFFFFFFFFFF16A2E0B8F03E13DD29455C5C2A3D","1","B70E0CBD6BB4BF7F321390B94A03C1D356C21122343280D6115C1D21","BD376388B5F723FB4C22DFE6CD4375A05A07476444D5819985007E34",[]),Er.crypto.ECParameterDB.regist("secp256k1",256,"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F","0","7","FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141","1","79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798","483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8",[]),Er.crypto.ECParameterDB.regist("secp256r1",256,"FFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFF","FFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFC","5AC635D8AA3A93E7B3EBBD55769886BC651D06B0CC53B0F63BCE3C3E27D2604B","FFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551","1","6B17D1F2E12C4247F8BCE6E563A440F277037D812DEB33A0F4A13945D898C296","4FE342E2FE1A7F9B8EE7EB4A7C0F9E162BCE33576B315ECECBB6406837BF51F5",["NIST P-256","P-256","prime256v1"]),Er.crypto.ECParameterDB.regist("secp384r1",384,"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFF0000000000000000FFFFFFFF","FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFF0000000000000000FFFFFFFC","B3312FA7E23EE7E4988E056BE3F82D19181D9C6EFE8141120314088F5013875AC656398D8A2ED19D2A85C8EDD3EC2AEF","FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC7634D81F4372DDF581A0DB248B0A77AECEC196ACCC52973","1","AA87CA22BE8B05378EB1C71EF320AD746E1D3B628BA79B9859F741E082542A385502F25DBF55296C3A545E3872760AB7","3617de4a96262c6f5d9e98bf9292dc29f8f41dbd289a147ce9da3113b5f0b8c00a60b1ce1d7e819d7a431d7c90ea0e5f",["NIST P-384","P-384"]),Er.crypto.ECParameterDB.regist("secp521r1",521,"1FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF","1FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC","051953EB9618E1C9A1F929A21A0B68540EEA2DA725B99B315F3B8B489918EF109E156193951EC7E937B1652C0BD3BB1BF073573DF883D2C34F1EF451FD46B503F00","1FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFA51868783BF2F966B7FCC0148F709A5D03BB5C9B8899C47AEBB6FB71E91386409","1","C6858E06B70404E9CD9E3ECB662395B4429C648139053FB521F828AF606B4D3DBAA14B5E77EFE75928FE1DC127A2FFA8DE3348B3C1856A429BF97E7E31C2E5BD66","011839296a789a3bc0045c8a5fb42c7d1bd998f54449579b446817afbd17273e662c97ee72995ef42640c550b9013fad0761353c7086a272c24088be94769fd16650",["NIST P-521","P-521"]);var tn=function(){var t=function t(r,n,i){return e(y.AES,r,n,i)},e=function t(e,r,n,i){var o=y.enc.Hex.parse(r),s=y.enc.Hex.parse(n),a=y.enc.Hex.parse(i),u={};u.key=s,u.iv=a,u.ciphertext=o;var c=e.decrypt(u,s,{iv:a});return y.enc.Hex.stringify(c)},r=function t(e,r,i){return n(y.AES,e,r,i)},n=function t(e,r,n,i){var o=y.enc.Hex.parse(r),s=y.enc.Hex.parse(n),a=y.enc.Hex.parse(i),u=e.encrypt(o,s,{iv:a}),c=y.enc.Hex.parse(u.toString());return y.enc.Base64.stringify(c)},i={"AES-256-CBC":{proc:t,eproc:r,keylen:32,ivlen:16},"AES-192-CBC":{proc:t,eproc:r,keylen:24,ivlen:16},"AES-128-CBC":{proc:t,eproc:r,keylen:16,ivlen:16},"DES-EDE3-CBC":{proc:function t(r,n,i){return e(y.TripleDES,r,n,i)},eproc:function t(e,r,i){return n(y.TripleDES,e,r,i)},keylen:24,ivlen:8},"DES-CBC":{proc:function t(r,n,i){return e(y.DES,r,n,i)},eproc:function t(e,r,i){return n(y.DES,e,r,i)},keylen:8,ivlen:8}},o=function t(e){var r={},n=e.match(new RegExp("DEK-Info: ([^,]+),([0-9A-Fa-f]+)","m"));n&&(r.cipher=n[1],r.ivsalt=n[2]);var i=e.match(new RegExp("-----BEGIN ([A-Z]+) PRIVATE KEY-----"));i&&(r.type=i[1]);var o=-1,s=0;-1!=e.indexOf("\r\n\r\n")&&(o=e.indexOf("\r\n\r\n"),s=2),-1!=e.indexOf("\n\n")&&(o=e.indexOf("\n\n"),s=1);var a=e.indexOf("-----END");if(-1!=o&&-1!=a){var u=e.substring(o+2*s,a-s);u=u.replace(/\s+/g,""),r.data=u;}return r},s=function t(e,r,n){for(var o=n.substring(0,16),s=y.enc.Hex.parse(o),a=y.enc.Utf8.parse(r),u=i[e].keylen+i[e].ivlen,c="",h=null;;){var l=y.algo.MD5.create();if(null!=h&&l.update(h),l.update(a),l.update(s),h=l.finalize(),(c+=y.enc.Hex.stringify(h)).length>=2*u)break}var f={};return f.keyhex=c.substr(0,2*i[e].keylen),f.ivhex=c.substr(2*i[e].keylen,2*i[e].ivlen),f},a=function t(e,r,n,o){var s=y.enc.Base64.parse(e),a=y.enc.Hex.stringify(s);return (0, i[r].proc)(a,n,o)};return {version:"1.0.0",parsePKCS5PEM:function t(e){return o(e)},getKeyAndUnusedIvByPasscodeAndIvsalt:function t(e,r,n){return s(e,r,n)},decryptKeyB64:function t(e,r,n,i){return a(e,r,n,i)},getDecryptedKeyHex:function t(e,r){var n=o(e),i=(n.cipher),u=n.ivsalt,c=n.data,h=s(i,r,u).keyhex;return a(c,i,h,u)},getEncryptedPKCS5PEMFromPrvKeyHex:function t(e,r,n,o,a){var u="";if(void 0!==o&&null!=o||(o="AES-256-CBC"),void 0===i[o])throw "KEYUTIL unsupported algorithm: "+o;void 0!==a&&null!=a||(a=function t(e){var r=y.lib.WordArray.random(e);return y.enc.Hex.stringify(r)}(i[o].ivlen).toUpperCase());var c=function t(e,r,n,o){return (0, i[r].eproc)(e,n,o)}(r,o,s(o,n,a).keyhex,a);u="-----BEGIN "+e+" PRIVATE KEY-----\r\n";return u+="Proc-Type: 4,ENCRYPTED\r\n",u+="DEK-Info: "+o+","+a+"\r\n",u+="\r\n",u+=c.replace(/(.{64})/g,"$1\r\n"),u+="\r\n-----END "+e+" PRIVATE KEY-----\r\n"},parseHexOfEncryptedPKCS8:function t(e){var r=Ar,n=r.getChildIdx,i=r.getV,o={},s=n(e,0);if(2!=s.length)throw "malformed format: SEQUENCE(0).items != 2: "+s.length;o.ciphertext=i(e,s[1]);var a=n(e,s[0]);if(2!=a.length)throw "malformed format: SEQUENCE(0.0).items != 2: "+a.length;if("2a864886f70d01050d"!=i(e,a[0]))throw "this only supports pkcs5PBES2";var u=n(e,a[1]);if(2!=a.length)throw "malformed format: SEQUENCE(0.0.1).items != 2: "+u.length;var c=n(e,u[1]);if(2!=c.length)throw "malformed format: SEQUENCE(0.0.1.1).items != 2: "+c.length;if("2a864886f70d0307"!=i(e,c[0]))throw "this only supports TripleDES";o.encryptionSchemeAlg="TripleDES",o.encryptionSchemeIV=i(e,c[1]);var h=n(e,u[0]);if(2!=h.length)throw "malformed format: SEQUENCE(0.0.1.0).items != 2: "+h.length;if("2a864886f70d01050c"!=i(e,h[0]))throw "this only supports pkcs5PBKDF2";var l=n(e,h[1]);if(l.length<2)throw "malformed format: SEQUENCE(0.0.1.0.1).items < 2: "+l.length;o.pbkdf2Salt=i(e,l[0]);var f=i(e,l[1]);try{o.pbkdf2Iter=parseInt(f,16);}catch(t){throw "malformed format pbkdf2Iter: "+f}return o},getPBKDF2KeyHexFromParam:function t(e,r){var n=y.enc.Hex.parse(e.pbkdf2Salt),i=e.pbkdf2Iter,o=y.PBKDF2(r,n,{keySize:6,iterations:i});return y.enc.Hex.stringify(o)},_getPlainPKCS8HexFromEncryptedPKCS8PEM:function t(e,r){var n=qr(e,"ENCRYPTED PRIVATE KEY"),i=this.parseHexOfEncryptedPKCS8(n),o=tn.getPBKDF2KeyHexFromParam(i,r),s={};s.ciphertext=y.enc.Hex.parse(i.ciphertext);var a=y.enc.Hex.parse(o),u=y.enc.Hex.parse(i.encryptionSchemeIV),c=y.TripleDES.decrypt(s,a,{iv:u});return y.enc.Hex.stringify(c)},getKeyFromEncryptedPKCS8PEM:function t(e,r){var n=this._getPlainPKCS8HexFromEncryptedPKCS8PEM(e,r);return this.getKeyFromPlainPrivatePKCS8Hex(n)},parsePlainPrivatePKCS8Hex:function t(e){var r=Ar,n=r.getChildIdx,i=r.getV,o={algparam:null};if("30"!=e.substr(0,2))throw "malformed plain PKCS8 private key(code:001)";var s=n(e,0);if(3!=s.length)throw "malformed plain PKCS8 private key(code:002)";if("30"!=e.substr(s[1],2))throw "malformed PKCS8 private key(code:003)";var a=n(e,s[1]);if(2!=a.length)throw "malformed PKCS8 private key(code:004)";if("06"!=e.substr(a[0],2))throw "malformed PKCS8 private key(code:005)";if(o.algoid=i(e,a[0]),"06"==e.substr(a[1],2)&&(o.algparam=i(e,a[1])),"04"!=e.substr(s[2],2))throw "malformed PKCS8 private key(code:006)";return o.keyidx=r.getVidx(e,s[2]),o},getKeyFromPlainPrivatePKCS8PEM:function t(e){var r=qr(e,"PRIVATE KEY");return this.getKeyFromPlainPrivatePKCS8Hex(r)},getKeyFromPlainPrivatePKCS8Hex:function t(e){var r,n=this.parsePlainPrivatePKCS8Hex(e);if("2a864886f70d010101"==n.algoid)r=new qe;else if("2a8648ce380401"==n.algoid)r=new Er.crypto.DSA;else {if("2a8648ce3d0201"!=n.algoid)throw "unsupported private key algorithm";r=new Er.crypto.ECDSA;}return r.readPKCS8PrvKeyHex(e),r},_getKeyFromPublicPKCS8Hex:function t(e){var r,n=Ar.getVbyList(e,0,[0,0],"06");if("2a864886f70d010101"===n)r=new qe;else if("2a8648ce380401"===n)r=new Er.crypto.DSA;else {if("2a8648ce3d0201"!==n)throw "unsupported PKCS#8 public key hex";r=new Er.crypto.ECDSA;}return r.readPKCS8PubKeyHex(e),r},parsePublicRawRSAKeyHex:function t(e){var r=Ar,n=r.getChildIdx,i=r.getV,o={};if("30"!=e.substr(0,2))throw "malformed RSA key(code:001)";var s=n(e,0);if(2!=s.length)throw "malformed RSA key(code:002)";if("02"!=e.substr(s[0],2))throw "malformed RSA key(code:003)";if(o.n=i(e,s[0]),"02"!=e.substr(s[1],2))throw "malformed RSA key(code:004)";return o.e=i(e,s[1]),o},parsePublicPKCS8Hex:function t(e){var r=Ar,n=r.getChildIdx,i=r.getV,o={algparam:null},s=n(e,0);if(2!=s.length)throw "outer DERSequence shall have 2 elements: "+s.length;var a=s[0];if("30"!=e.substr(a,2))throw "malformed PKCS8 public key(code:001)";var u=n(e,a);if(2!=u.length)throw "malformed PKCS8 public key(code:002)";if("06"!=e.substr(u[0],2))throw "malformed PKCS8 public key(code:003)";if(o.algoid=i(e,u[0]),"06"==e.substr(u[1],2)?o.algparam=i(e,u[1]):"30"==e.substr(u[1],2)&&(o.algparam={},o.algparam.p=r.getVbyList(e,u[1],[0],"02"),o.algparam.q=r.getVbyList(e,u[1],[1],"02"),o.algparam.g=r.getVbyList(e,u[1],[2],"02")),"03"!=e.substr(s[1],2))throw "malformed PKCS8 public key(code:004)";return o.key=i(e,s[1]).substr(2),o}}}();tn.getKey=function(t,e,r){var n=(v=Ar).getChildIdx,i=(v.getV,v.getVbyList),o=Er.crypto,s=o.ECDSA,a=o.DSA,u=qe,c=qr,h=tn;if(void 0!==u&&t instanceof u)return t;if(void 0!==s&&t instanceof s)return t;if(void 0!==a&&t instanceof a)return t;if(void 0!==t.curve&&void 0!==t.xy&&void 0===t.d)return new s({pub:t.xy,curve:t.curve});if(void 0!==t.curve&&void 0!==t.d)return new s({prv:t.d,curve:t.curve});if(void 0===t.kty&&void 0!==t.n&&void 0!==t.e&&void 0===t.d)return (P=new u).setPublic(t.n,t.e),P;if(void 0===t.kty&&void 0!==t.n&&void 0!==t.e&&void 0!==t.d&&void 0!==t.p&&void 0!==t.q&&void 0!==t.dp&&void 0!==t.dq&&void 0!==t.co&&void 0===t.qi)return (P=new u).setPrivateEx(t.n,t.e,t.d,t.p,t.q,t.dp,t.dq,t.co),P;if(void 0===t.kty&&void 0!==t.n&&void 0!==t.e&&void 0!==t.d&&void 0===t.p)return (P=new u).setPrivate(t.n,t.e,t.d),P;if(void 0!==t.p&&void 0!==t.q&&void 0!==t.g&&void 0!==t.y&&void 0===t.x)return (P=new a).setPublic(t.p,t.q,t.g,t.y),P;if(void 0!==t.p&&void 0!==t.q&&void 0!==t.g&&void 0!==t.y&&void 0!==t.x)return (P=new a).setPrivate(t.p,t.q,t.g,t.y,t.x),P;if("RSA"===t.kty&&void 0!==t.n&&void 0!==t.e&&void 0===t.d)return (P=new u).setPublic(Lr(t.n),Lr(t.e)),P;if("RSA"===t.kty&&void 0!==t.n&&void 0!==t.e&&void 0!==t.d&&void 0!==t.p&&void 0!==t.q&&void 0!==t.dp&&void 0!==t.dq&&void 0!==t.qi)return (P=new u).setPrivateEx(Lr(t.n),Lr(t.e),Lr(t.d),Lr(t.p),Lr(t.q),Lr(t.dp),Lr(t.dq),Lr(t.qi)),P;if("RSA"===t.kty&&void 0!==t.n&&void 0!==t.e&&void 0!==t.d)return (P=new u).setPrivate(Lr(t.n),Lr(t.e),Lr(t.d)),P;if("EC"===t.kty&&void 0!==t.crv&&void 0!==t.x&&void 0!==t.y&&void 0===t.d){var l=(A=new s({curve:t.crv})).ecparams.keylen/4,f="04"+("0000000000"+Lr(t.x)).slice(-l)+("0000000000"+Lr(t.y)).slice(-l);return A.setPublicKeyHex(f),A}if("EC"===t.kty&&void 0!==t.crv&&void 0!==t.x&&void 0!==t.y&&void 0!==t.d){l=(A=new s({curve:t.crv})).ecparams.keylen/4,f="04"+("0000000000"+Lr(t.x)).slice(-l)+("0000000000"+Lr(t.y)).slice(-l);var d=("0000000000"+Lr(t.d)).slice(-l);return A.setPublicKeyHex(f),A.setPrivateKeyHex(d),A}if("pkcs5prv"===r){var g,p=t,v=Ar;if(9===(g=n(p,0)).length)(P=new u).readPKCS5PrvKeyHex(p);else if(6===g.length)(P=new a).readPKCS5PrvKeyHex(p);else {if(!(g.length>2&&"04"===p.substr(g[1],2)))throw "unsupported PKCS#1/5 hexadecimal key";(P=new s).readPKCS5PrvKeyHex(p);}return P}if("pkcs8prv"===r)return P=h.getKeyFromPlainPrivatePKCS8Hex(t);if("pkcs8pub"===r)return h._getKeyFromPublicPKCS8Hex(t);if("x509pub"===r)return sn.getPublicKeyFromCertHex(t);if(-1!=t.indexOf("-END CERTIFICATE-",0)||-1!=t.indexOf("-END X509 CERTIFICATE-",0)||-1!=t.indexOf("-END TRUSTED CERTIFICATE-",0))return sn.getPublicKeyFromCertPEM(t);if(-1!=t.indexOf("-END PUBLIC KEY-")){var y=qr(t,"PUBLIC KEY");return h._getKeyFromPublicPKCS8Hex(y)}if(-1!=t.indexOf("-END RSA PRIVATE KEY-")&&-1==t.indexOf("4,ENCRYPTED")){var m=c(t,"RSA PRIVATE KEY");return h.getKey(m,null,"pkcs5prv")}if(-1!=t.indexOf("-END DSA PRIVATE KEY-")&&-1==t.indexOf("4,ENCRYPTED")){var _=i(R=c(t,"DSA PRIVATE KEY"),0,[1],"02"),S=i(R,0,[2],"02"),F=i(R,0,[3],"02"),b=i(R,0,[4],"02"),w=i(R,0,[5],"02");return (P=new a).setPrivate(new E(_,16),new E(S,16),new E(F,16),new E(b,16),new E(w,16)),P}if(-1!=t.indexOf("-END PRIVATE KEY-"))return h.getKeyFromPlainPrivatePKCS8PEM(t);if(-1!=t.indexOf("-END RSA PRIVATE KEY-")&&-1!=t.indexOf("4,ENCRYPTED")){var x=h.getDecryptedKeyHex(t,e),k=new qe;return k.readPKCS5PrvKeyHex(x),k}if(-1!=t.indexOf("-END EC PRIVATE KEY-")&&-1!=t.indexOf("4,ENCRYPTED")){var A,P=i(R=h.getDecryptedKeyHex(t,e),0,[1],"04"),C=i(R,0,[2,0],"06"),T=i(R,0,[3,0],"03").substr(2);if(void 0===Er.crypto.OID.oidhex2name[C])throw "undefined OID(hex) in KJUR.crypto.OID: "+C;return (A=new s({curve:Er.crypto.OID.oidhex2name[C]})).setPublicKeyHex(T),A.setPrivateKeyHex(P),A.isPublic=!1,A}if(-1!=t.indexOf("-END DSA PRIVATE KEY-")&&-1!=t.indexOf("4,ENCRYPTED")){var R;_=i(R=h.getDecryptedKeyHex(t,e),0,[1],"02"),S=i(R,0,[2],"02"),F=i(R,0,[3],"02"),b=i(R,0,[4],"02"),w=i(R,0,[5],"02");return (P=new a).setPrivate(new E(_,16),new E(S,16),new E(F,16),new E(b,16),new E(w,16)),P}if(-1!=t.indexOf("-END ENCRYPTED PRIVATE KEY-"))return h.getKeyFromEncryptedPKCS8PEM(t,e);throw "not supported argument"},tn.generateKeypair=function(t,e){if("RSA"==t){var r=e;(s=new qe).generate(r,"10001"),s.isPrivate=!0,s.isPublic=!0;var n=new qe,i=s.n.toString(16),o=s.e.toString(16);return n.setPublic(i,o),n.isPrivate=!1,n.isPublic=!0,(a={}).prvKeyObj=s,a.pubKeyObj=n,a}if("EC"==t){var s,a,u=e,c=new Er.crypto.ECDSA({curve:u}).generateKeyPairHex();return (s=new Er.crypto.ECDSA({curve:u})).setPublicKeyHex(c.ecpubhex),s.setPrivateKeyHex(c.ecprvhex),s.isPrivate=!0,s.isPublic=!1,(n=new Er.crypto.ECDSA({curve:u})).setPublicKeyHex(c.ecpubhex),n.isPrivate=!1,n.isPublic=!0,(a={}).prvKeyObj=s,a.pubKeyObj=n,a}throw "unknown algorithm: "+t},tn.getPEM=function(t,e,r,n,i,o){var s=Er,a=s.asn1,u=a.DERObjectIdentifier,c=a.DERInteger,h=a.ASN1Util.newObject,l=a.x509.SubjectPublicKeyInfo,f=s.crypto,d=f.DSA,g=f.ECDSA,p=qe;function v(t){return h({seq:[{int:0},{int:{bigint:t.n}},{int:t.e},{int:{bigint:t.d}},{int:{bigint:t.p}},{int:{bigint:t.q}},{int:{bigint:t.dmp1}},{int:{bigint:t.dmq1}},{int:{bigint:t.coeff}}]})}function m(t){return h({seq:[{int:1},{octstr:{hex:t.prvKeyHex}},{tag:["a0",!0,{oid:{name:t.curveName}}]},{tag:["a1",!0,{bitstr:{hex:"00"+t.pubKeyHex}}]}]})}function _(t){return h({seq:[{int:0},{int:{bigint:t.p}},{int:{bigint:t.q}},{int:{bigint:t.g}},{int:{bigint:t.y}},{int:{bigint:t.x}}]})}if((void 0!==p&&t instanceof p||void 0!==d&&t instanceof d||void 0!==g&&t instanceof g)&&1==t.isPublic&&(void 0===e||"PKCS8PUB"==e))return Vr(w=new l(t).getEncodedHex(),"PUBLIC KEY");if("PKCS1PRV"==e&&void 0!==p&&t instanceof p&&(void 0===r||null==r)&&1==t.isPrivate)return Vr(w=v(t).getEncodedHex(),"RSA PRIVATE KEY");if("PKCS1PRV"==e&&void 0!==g&&t instanceof g&&(void 0===r||null==r)&&1==t.isPrivate){var S=new u({name:t.curveName}).getEncodedHex(),F=m(t).getEncodedHex(),b="";return b+=Vr(S,"EC PARAMETERS"),b+=Vr(F,"EC PRIVATE KEY")}if("PKCS1PRV"==e&&void 0!==d&&t instanceof d&&(void 0===r||null==r)&&1==t.isPrivate)return Vr(w=_(t).getEncodedHex(),"DSA PRIVATE KEY");if("PKCS5PRV"==e&&void 0!==p&&t instanceof p&&void 0!==r&&null!=r&&1==t.isPrivate){var w=v(t).getEncodedHex();return void 0===n&&(n="DES-EDE3-CBC"),this.getEncryptedPKCS5PEMFromPrvKeyHex("RSA",w,r,n,o)}if("PKCS5PRV"==e&&void 0!==g&&t instanceof g&&void 0!==r&&null!=r&&1==t.isPrivate){w=m(t).getEncodedHex();return void 0===n&&(n="DES-EDE3-CBC"),this.getEncryptedPKCS5PEMFromPrvKeyHex("EC",w,r,n,o)}if("PKCS5PRV"==e&&void 0!==d&&t instanceof d&&void 0!==r&&null!=r&&1==t.isPrivate){w=_(t).getEncodedHex();return void 0===n&&(n="DES-EDE3-CBC"),this.getEncryptedPKCS5PEMFromPrvKeyHex("DSA",w,r,n,o)}var E=function t(e,r){var n=x(e,r);return new h({seq:[{seq:[{oid:{name:"pkcs5PBES2"}},{seq:[{seq:[{oid:{name:"pkcs5PBKDF2"}},{seq:[{octstr:{hex:n.pbkdf2Salt}},{int:n.pbkdf2Iter}]}]},{seq:[{oid:{name:"des-EDE3-CBC"}},{octstr:{hex:n.encryptionSchemeIV}}]}]}]},{octstr:{hex:n.ciphertext}}]}).getEncodedHex()},x=function t(e,r){var n=y.lib.WordArray.random(8),i=y.lib.WordArray.random(8),o=y.PBKDF2(r,n,{keySize:6,iterations:100}),s=y.enc.Hex.parse(e),a=y.TripleDES.encrypt(s,o,{iv:i})+"",u={};return u.ciphertext=a,u.pbkdf2Salt=y.enc.Hex.stringify(n),u.pbkdf2Iter=100,u.encryptionSchemeAlg="DES-EDE3-CBC",u.encryptionSchemeIV=y.enc.Hex.stringify(i),u};if("PKCS8PRV"==e&&void 0!=p&&t instanceof p&&1==t.isPrivate){var k=v(t).getEncodedHex();w=h({seq:[{int:0},{seq:[{oid:{name:"rsaEncryption"}},{null:!0}]},{octstr:{hex:k}}]}).getEncodedHex();return void 0===r||null==r?Vr(w,"PRIVATE KEY"):Vr(F=E(w,r),"ENCRYPTED PRIVATE KEY")}if("PKCS8PRV"==e&&void 0!==g&&t instanceof g&&1==t.isPrivate){k=new h({seq:[{int:1},{octstr:{hex:t.prvKeyHex}},{tag:["a1",!0,{bitstr:{hex:"00"+t.pubKeyHex}}]}]}).getEncodedHex(),w=h({seq:[{int:0},{seq:[{oid:{name:"ecPublicKey"}},{oid:{name:t.curveName}}]},{octstr:{hex:k}}]}).getEncodedHex();return void 0===r||null==r?Vr(w,"PRIVATE KEY"):Vr(F=E(w,r),"ENCRYPTED PRIVATE KEY")}if("PKCS8PRV"==e&&void 0!==d&&t instanceof d&&1==t.isPrivate){k=new c({bigint:t.x}).getEncodedHex(),w=h({seq:[{int:0},{seq:[{oid:{name:"dsa"}},{seq:[{int:{bigint:t.p}},{int:{bigint:t.q}},{int:{bigint:t.g}}]}]},{octstr:{hex:k}}]}).getEncodedHex();return void 0===r||null==r?Vr(w,"PRIVATE KEY"):Vr(F=E(w,r),"ENCRYPTED PRIVATE KEY")}throw "unsupported object nor format"},tn.getKeyFromCSRPEM=function(t){var e=qr(t,"CERTIFICATE REQUEST");return tn.getKeyFromCSRHex(e)},tn.getKeyFromCSRHex=function(t){var e=tn.parseCSRHex(t);return tn.getKey(e.p8pubkeyhex,null,"pkcs8pub")},tn.parseCSRHex=function(t){var e=Ar,r=e.getChildIdx,n=e.getTLV,i={},o=t;if("30"!=o.substr(0,2))throw "malformed CSR(code:001)";var s=r(o,0);if(s.length<1)throw "malformed CSR(code:002)";if("30"!=o.substr(s[0],2))throw "malformed CSR(code:003)";var a=r(o,s[0]);if(a.length<3)throw "malformed CSR(code:004)";return i.p8pubkeyhex=n(o,a[2]),i},tn.getJWKFromKey=function(t){var e={};if(t instanceof qe&&t.isPrivate)return e.kty="RSA",e.n=Ur(t.n.toString(16)),e.e=Ur(t.e.toString(16)),e.d=Ur(t.d.toString(16)),e.p=Ur(t.p.toString(16)),e.q=Ur(t.q.toString(16)),e.dp=Ur(t.dmp1.toString(16)),e.dq=Ur(t.dmq1.toString(16)),e.qi=Ur(t.coeff.toString(16)),e;if(t instanceof qe&&t.isPublic)return e.kty="RSA",e.n=Ur(t.n.toString(16)),e.e=Ur(t.e.toString(16)),e;if(t instanceof Er.crypto.ECDSA&&t.isPrivate){if("P-256"!==(n=t.getShortNISTPCurveName())&&"P-384"!==n)throw "unsupported curve name for JWT: "+n;var r=t.getPublicKeyXYHex();return e.kty="EC",e.crv=n,e.x=Ur(r.x),e.y=Ur(r.y),e.d=Ur(t.prvKeyHex),e}if(t instanceof Er.crypto.ECDSA&&t.isPublic){var n;if("P-256"!==(n=t.getShortNISTPCurveName())&&"P-384"!==n)throw "unsupported curve name for JWT: "+n;r=t.getPublicKeyXYHex();return e.kty="EC",e.crv=n,e.x=Ur(r.x),e.y=Ur(r.y),e}throw "not supported key object"},qe.getPosArrayOfChildrenFromHex=function(t){return Ar.getChildIdx(t,0)},qe.getHexValueArrayOfChildrenFromHex=function(t){var e,r=Ar.getV,n=r(t,(e=qe.getPosArrayOfChildrenFromHex(t))[0]),i=r(t,e[1]),o=r(t,e[2]),s=r(t,e[3]),a=r(t,e[4]),u=r(t,e[5]),c=r(t,e[6]),h=r(t,e[7]),l=r(t,e[8]);return (e=new Array).push(n,i,o,s,a,u,c,h,l),e},qe.prototype.readPrivateKeyFromPEMString=function(t){var e=qr(t),r=qe.getHexValueArrayOfChildrenFromHex(e);this.setPrivateEx(r[1],r[2],r[3],r[4],r[5],r[6],r[7],r[8]);},qe.prototype.readPKCS5PrvKeyHex=function(t){var e=qe.getHexValueArrayOfChildrenFromHex(t);this.setPrivateEx(e[1],e[2],e[3],e[4],e[5],e[6],e[7],e[8]);},qe.prototype.readPKCS8PrvKeyHex=function(t){var e,r,n,i,o,s,a,u,c=Ar,h=c.getVbyList;if(!1===c.isASN1HEX(t))throw "not ASN.1 hex string";try{e=h(t,0,[2,0,1],"02"),r=h(t,0,[2,0,2],"02"),n=h(t,0,[2,0,3],"02"),i=h(t,0,[2,0,4],"02"),o=h(t,0,[2,0,5],"02"),s=h(t,0,[2,0,6],"02"),a=h(t,0,[2,0,7],"02"),u=h(t,0,[2,0,8],"02");}catch(t){throw "malformed PKCS#8 plain RSA private key"}this.setPrivateEx(e,r,n,i,o,s,a,u);},qe.prototype.readPKCS5PubKeyHex=function(t){var e=Ar,r=e.getV;if(!1===e.isASN1HEX(t))throw "keyHex is not ASN.1 hex string";var n=e.getChildIdx(t,0);if(2!==n.length||"02"!==t.substr(n[0],2)||"02"!==t.substr(n[1],2))throw "wrong hex for PKCS#5 public key";var i=r(t,n[0]),o=r(t,n[1]);this.setPublic(i,o);},qe.prototype.readPKCS8PubKeyHex=function(t){var e=Ar;if(!1===e.isASN1HEX(t))throw "not ASN.1 hex string";if("06092a864886f70d010101"!==e.getTLVbyList(t,0,[0,0]))throw "not PKCS8 RSA public key";var r=e.getTLVbyList(t,0,[1,0]);this.readPKCS5PubKeyHex(r);},qe.prototype.readCertPubKeyHex=function(t,e){var r,n;(r=new sn).readCertHex(t),n=r.getPublicKeyHex(),this.readPKCS8PubKeyHex(n);};var en=new RegExp("");function rn(t,e){for(var r="",n=e/4-t.length,i=0;i<n;i++)r+="0";return r+t}function nn(t,e,r){for(var n="",i=0;n.length<e;)n+=Or(r(jr(t+String.fromCharCode.apply(String,[(4278190080&i)>>24,(16711680&i)>>16,(65280&i)>>8,255&i])))),i+=1;return n}function on(t){for(var e in Er.crypto.Util.DIGESTINFOHEAD){var r=Er.crypto.Util.DIGESTINFOHEAD[e],n=r.length;if(t.substring(0,n)==r)return [e,t.substring(n)]}return []}function sn(){var t=Ar,e=t.getChildIdx,r=t.getV,n=t.getTLV,i=t.getVbyList,o=t.getTLVbyList,s=t.getIdxbyList,a=t.getVidx,u=t.oidname,c=sn,h=qr;this.hex=null,this.version=0,this.foffset=0,this.aExtInfo=null,this.getVersion=function(){return null===this.hex||0!==this.version?this.version:"a003020102"!==o(this.hex,0,[0,0])?(this.version=1,this.foffset=-1,1):(this.version=3,3)},this.getSerialNumberHex=function(){return i(this.hex,0,[0,1+this.foffset],"02")},this.getSignatureAlgorithmField=function(){return u(i(this.hex,0,[0,2+this.foffset,0],"06"))},this.getIssuerHex=function(){return o(this.hex,0,[0,3+this.foffset],"30")},this.getIssuerString=function(){return c.hex2dn(this.getIssuerHex())},this.getSubjectHex=function(){return o(this.hex,0,[0,5+this.foffset],"30")},this.getSubjectString=function(){return c.hex2dn(this.getSubjectHex())},this.getNotBefore=function(){var t=i(this.hex,0,[0,4+this.foffset,0]);return t=t.replace(/(..)/g,"%$1"),t=decodeURIComponent(t)},this.getNotAfter=function(){var t=i(this.hex,0,[0,4+this.foffset,1]);return t=t.replace(/(..)/g,"%$1"),t=decodeURIComponent(t)},this.getPublicKeyHex=function(){return t.getTLVbyList(this.hex,0,[0,6+this.foffset],"30")},this.getPublicKeyIdx=function(){return s(this.hex,0,[0,6+this.foffset],"30")},this.getPublicKeyContentIdx=function(){var t=this.getPublicKeyIdx();return s(this.hex,t,[1,0],"30")},this.getPublicKey=function(){return tn.getKey(this.getPublicKeyHex(),null,"pkcs8pub")},this.getSignatureAlgorithmName=function(){return u(i(this.hex,0,[1,0],"06"))},this.getSignatureValueHex=function(){return i(this.hex,0,[2],"03",!0)},this.verifySignature=function(t){var e=this.getSignatureAlgorithmName(),r=this.getSignatureValueHex(),n=o(this.hex,0,[0],"30"),i=new Er.crypto.Signature({alg:e});return i.init(t),i.updateHex(n),i.verify(r)},this.parseExt=function(){if(3!==this.version)return -1;var r=s(this.hex,0,[0,7,0],"30"),n=e(this.hex,r);this.aExtInfo=new Array;for(var o=0;o<n.length;o++){var u={critical:!1},c=0;3===e(this.hex,n[o]).length&&(u.critical=!0,c=1),u.oid=t.hextooidstr(i(this.hex,n[o],[0],"06"));var h=s(this.hex,n[o],[1+c]);u.vidx=a(this.hex,h),this.aExtInfo.push(u);}},this.getExtInfo=function(t){var e=this.aExtInfo,r=t;if(t.match(/^[0-9.]+$/)||(r=Er.asn1.x509.OID.name2oid(t)),""!==r)for(var n=0;n<e.length;n++)if(e[n].oid===r)return e[n]},this.getExtBasicConstraints=function(){var t=this.getExtInfo("basicConstraints");if(void 0===t)return t;var e=r(this.hex,t.vidx);if(""===e)return {};if("0101ff"===e)return {cA:!0};if("0101ff02"===e.substr(0,8)){var n=r(e,6);return {cA:!0,pathLen:parseInt(n,16)}}throw "basicConstraints parse error"},this.getExtKeyUsageBin=function(){var t=this.getExtInfo("keyUsage");if(void 0===t)return "";var e=r(this.hex,t.vidx);if(e.length%2!=0||e.length<=2)throw "malformed key usage value";var n=parseInt(e.substr(0,2)),i=parseInt(e.substr(2),16).toString(2);return i.substr(0,i.length-n)},this.getExtKeyUsageString=function(){for(var t=this.getExtKeyUsageBin(),e=new Array,r=0;r<t.length;r++)"1"==t.substr(r,1)&&e.push(sn.KEYUSAGE_NAME[r]);return e.join(",")},this.getExtSubjectKeyIdentifier=function(){var t=this.getExtInfo("subjectKeyIdentifier");return void 0===t?t:r(this.hex,t.vidx)},this.getExtAuthorityKeyIdentifier=function(){var t=this.getExtInfo("authorityKeyIdentifier");if(void 0===t)return t;for(var i={},o=n(this.hex,t.vidx),s=e(o,0),a=0;a<s.length;a++)"80"===o.substr(s[a],2)&&(i.kid=r(o,s[a]));return i},this.getExtExtKeyUsageName=function(){var t=this.getExtInfo("extKeyUsage");if(void 0===t)return t;var i=new Array,o=n(this.hex,t.vidx);if(""===o)return i;for(var s=e(o,0),a=0;a<s.length;a++)i.push(u(r(o,s[a])));return i},this.getExtSubjectAltName=function(){for(var t=this.getExtSubjectAltName2(),e=new Array,r=0;r<t.length;r++)"DNS"===t[r][0]&&e.push(t[r][1]);return e},this.getExtSubjectAltName2=function(){var t,i,o,s=this.getExtInfo("subjectAltName");if(void 0===s)return s;for(var a=new Array,u=n(this.hex,s.vidx),c=e(u,0),h=0;h<c.length;h++)o=u.substr(c[h],2),t=r(u,c[h]),"81"===o&&(i=Nr(t),a.push(["MAIL",i])),"82"===o&&(i=Nr(t),a.push(["DNS",i])),"84"===o&&(i=sn.hex2dn(t,0),a.push(["DN",i])),"86"===o&&(i=Nr(t),a.push(["URI",i])),"87"===o&&(i=Qr(t),a.push(["IP",i]));return a},this.getExtCRLDistributionPointsURI=function(){var t=this.getExtInfo("cRLDistributionPoints");if(void 0===t)return t;for(var r=new Array,n=e(this.hex,t.vidx),o=0;o<n.length;o++)try{var s=Nr(i(this.hex,n[o],[0,0,0],"86"));r.push(s);}catch(t){}return r},this.getExtAIAInfo=function(){var t=this.getExtInfo("authorityInfoAccess");if(void 0===t)return t;for(var r={ocsp:[],caissuer:[]},n=e(this.hex,t.vidx),o=0;o<n.length;o++){var s=i(this.hex,n[o],[0],"06"),a=i(this.hex,n[o],[1],"86");"2b06010505073001"===s&&r.ocsp.push(Nr(a)),"2b06010505073002"===s&&r.caissuer.push(Nr(a));}return r},this.getExtCertificatePolicies=function(){var t=this.getExtInfo("certificatePolicies");if(void 0===t)return t;for(var o=n(this.hex,t.vidx),s=[],a=e(o,0),c=0;c<a.length;c++){var h={},l=e(o,a[c]);if(h.id=u(r(o,l[0])),2===l.length)for(var f=e(o,l[1]),d=0;d<f.length;d++){var g=i(o,f[d],[0],"06");"2b06010505070201"===g?h.cps=Nr(i(o,f[d],[1])):"2b06010505070202"===g&&(h.unotice=Nr(i(o,f[d],[1,0])));}s.push(h);}return s},this.readCertPEM=function(t){this.readCertHex(h(t));},this.readCertHex=function(t){this.hex=t,this.getVersion();try{s(this.hex,0,[0,7],"a3"),this.parseExt();}catch(t){}},this.getInfo=function(){var t,e,r;if(t="Basic Fields\n",t+="  serial number: "+this.getSerialNumberHex()+"\n",t+="  signature algorithm: "+this.getSignatureAlgorithmField()+"\n",t+="  issuer: "+this.getIssuerString()+"\n",t+="  notBefore: "+this.getNotBefore()+"\n",t+="  notAfter: "+this.getNotAfter()+"\n",t+="  subject: "+this.getSubjectString()+"\n",t+="  subject public key info: \n",t+="    key algorithm: "+(e=this.getPublicKey()).type+"\n","RSA"===e.type&&(t+="    n="+Zr(e.n.toString(16)).substr(0,16)+"...\n",t+="    e="+Zr(e.e.toString(16))+"\n"),void 0!==(r=this.aExtInfo)&&null!==r){t+="X509v3 Extensions:\n";for(var n=0;n<r.length;n++){var i=r[n],o=Er.asn1.x509.OID.oid2name(i.oid);""===o&&(o=i.oid);var s="";if(!0===i.critical&&(s="CRITICAL"),t+="  "+o+" "+s+":\n","basicConstraints"===o){var a=this.getExtBasicConstraints();void 0===a.cA?t+="    {}\n":(t+="    cA=true",void 0!==a.pathLen&&(t+=", pathLen="+a.pathLen),t+="\n");}else if("keyUsage"===o)t+="    "+this.getExtKeyUsageString()+"\n";else if("subjectKeyIdentifier"===o)t+="    "+this.getExtSubjectKeyIdentifier()+"\n";else if("authorityKeyIdentifier"===o){var u=this.getExtAuthorityKeyIdentifier();void 0!==u.kid&&(t+="    kid="+u.kid+"\n");}else {if("extKeyUsage"===o)t+="    "+this.getExtExtKeyUsageName().join(", ")+"\n";else if("subjectAltName"===o)t+="    "+this.getExtSubjectAltName2()+"\n";else if("cRLDistributionPoints"===o)t+="    "+this.getExtCRLDistributionPointsURI()+"\n";else if("authorityInfoAccess"===o){var c=this.getExtAIAInfo();void 0!==c.ocsp&&(t+="    ocsp: "+c.ocsp.join(",")+"\n"),void 0!==c.caissuer&&(t+="    caissuer: "+c.caissuer.join(",")+"\n");}else if("certificatePolicies"===o)for(var h=this.getExtCertificatePolicies(),l=0;l<h.length;l++)void 0!==h[l].id&&(t+="    policy oid: "+h[l].id+"\n"),void 0!==h[l].cps&&(t+="    cps: "+h[l].cps+"\n");}}}return t+="signature algorithm: "+this.getSignatureAlgorithmName()+"\n",t+="signature: "+this.getSignatureValueHex().substr(0,16)+"...\n"};}en.compile("[^0-9a-f]","gi"),qe.prototype.sign=function(t,e){var r=function t(r){return Er.crypto.Util.hashString(r,e)}(t);return this.signWithMessageHash(r,e)},qe.prototype.signWithMessageHash=function(t,e){var r=Ke(Er.crypto.Util.getPaddedDigestInfoHex(t,e,this.n.bitLength()),16);return rn(this.doPrivate(r).toString(16),this.n.bitLength())},qe.prototype.signPSS=function(t,e,r){var n=function t(r){return Er.crypto.Util.hashHex(r,e)}(jr(t));return void 0===r&&(r=-1),this.signWithMessageHashPSS(n,e,r)},qe.prototype.signWithMessageHashPSS=function(t,e,r){var n,i=Or(t),o=i.length,s=this.n.bitLength()-1,a=Math.ceil(s/8),u=function t(r){return Er.crypto.Util.hashHex(r,e)};if(-1===r||void 0===r)r=o;else if(-2===r)r=a-o-2;else if(r<-2)throw "invalid salt length";if(a<o+r+2)throw "data too long";var c="";r>0&&(c=new Array(r),(new Me).nextBytes(c),c=String.fromCharCode.apply(String,c));var h=Or(u(jr("\0\0\0\0\0\0\0\0"+i+c))),l=[];for(n=0;n<a-r-o-2;n+=1)l[n]=0;var f=String.fromCharCode.apply(String,l)+""+c,d=nn(h,f.length,u),g=[];for(n=0;n<f.length;n+=1)g[n]=f.charCodeAt(n)^d.charCodeAt(n);var p=65280>>8*a-s&255;for(g[0]&=~p,n=0;n<o;n++)g.push(h.charCodeAt(n));return g.push(188),rn(this.doPrivate(new E(g)).toString(16),this.n.bitLength())},qe.prototype.verify=function(t,e){var r=Ke(e=(e=e.replace(en,"")).replace(/[ \n]+/g,""),16);if(r.bitLength()>this.n.bitLength())return 0;var n=on(this.doPublic(r).toString(16).replace(/^1f+00/,""));if(0==n.length)return !1;var i=n[0];return n[1]==function t(e){return Er.crypto.Util.hashString(e,i)}(t)},qe.prototype.verifyWithMessageHash=function(t,e){var r=Ke(e=(e=e.replace(en,"")).replace(/[ \n]+/g,""),16);if(r.bitLength()>this.n.bitLength())return 0;var n=on(this.doPublic(r).toString(16).replace(/^1f+00/,""));if(0==n.length)return !1;n[0];return n[1]==t},qe.prototype.verifyPSS=function(t,e,r,n){var i=function t(e){return Er.crypto.Util.hashHex(e,r)}(jr(t));return void 0===n&&(n=-1),this.verifyWithMessageHashPSS(i,e,r,n)},qe.prototype.verifyWithMessageHashPSS=function(t,e,r,n){var i=new E(e,16);if(i.bitLength()>this.n.bitLength())return !1;var o,s=function t(e){return Er.crypto.Util.hashHex(e,r)},a=Or(t),u=a.length,c=this.n.bitLength()-1,h=Math.ceil(c/8);if(-1===n||void 0===n)n=u;else if(-2===n)n=h-u-2;else if(n<-2)throw "invalid salt length";if(h<u+n+2)throw "data too long";var l=this.doPublic(i).toByteArray();for(o=0;o<l.length;o+=1)l[o]&=255;for(;l.length<h;)l.unshift(0);if(188!==l[h-1])throw "encoded message does not end in 0xbc";var f=(l=String.fromCharCode.apply(String,l)).substr(0,h-u-1),d=l.substr(f.length,u),g=65280>>8*h-c&255;if(0!=(f.charCodeAt(0)&g))throw "bits beyond keysize not zero";var p=nn(d,f.length,s),v=[];for(o=0;o<f.length;o+=1)v[o]=f.charCodeAt(o)^p.charCodeAt(o);v[0]&=~g;var y=h-u-n-2;for(o=0;o<y;o+=1)if(0!==v[o])throw "leftmost octets not zero";if(1!==v[y])throw "0x01 marker not found";return d===Or(s(jr("\0\0\0\0\0\0\0\0"+a+String.fromCharCode.apply(String,v.slice(-n)))))},qe.SALT_LEN_HLEN=-1,qe.SALT_LEN_MAX=-2,qe.SALT_LEN_RECOVER=-2,sn.hex2dn=function(t,e){if(void 0===e&&(e=0),"30"!==t.substr(e,2))throw "malformed DN";for(var r=new Array,n=Ar.getChildIdx(t,e),i=0;i<n.length;i++)r.push(sn.hex2rdn(t,n[i]));return "/"+(r=r.map(function(t){return t.replace("/","\\/")})).join("/")},sn.hex2rdn=function(t,e){if(void 0===e&&(e=0),"31"!==t.substr(e,2))throw "malformed RDN";for(var r=new Array,n=Ar.getChildIdx(t,e),i=0;i<n.length;i++)r.push(sn.hex2attrTypeValue(t,n[i]));return (r=r.map(function(t){return t.replace("+","\\+")})).join("+")},sn.hex2attrTypeValue=function(t,e){var r=Ar,n=r.getV;if(void 0===e&&(e=0),"30"!==t.substr(e,2))throw "malformed attribute type and value";var i=r.getChildIdx(t,e);2!==i.length||t.substr(i[0],2);var o=n(t,i[0]),s=Er.asn1.ASN1Util.oidHexToInt(o);return Er.asn1.x509.OID.oid2atype(s)+"="+Or(n(t,i[1]))},sn.getPublicKeyFromCertHex=function(t){var e=new sn;return e.readCertHex(t),e.getPublicKey()},sn.getPublicKeyFromCertPEM=function(t){var e=new sn;return e.readCertPEM(t),e.getPublicKey()},sn.getPublicKeyInfoPropOfCertPEM=function(t){var e,r,n=Ar.getVbyList,i={};return i.algparam=null,(e=new sn).readCertPEM(t),r=e.getPublicKeyHex(),i.keyhex=n(r,0,[1],"03").substr(2),i.algoid=n(r,0,[0,0],"06"),"2a8648ce3d0201"===i.algoid&&(i.algparam=n(r,0,[0,1],"06")),i},sn.KEYUSAGE_NAME=["digitalSignature","nonRepudiation","keyEncipherment","dataEncipherment","keyAgreement","keyCertSign","cRLSign","encipherOnly","decipherOnly"],void 0!==Er&&Er||(e.KJUR=Er={}),void 0!==Er.jws&&Er.jws||(Er.jws={}),Er.jws.JWS=function(){var t=Er.jws.JWS.isSafeJSONString;this.parseJWS=function(e,r){if(void 0===this.parsedJWS||!r&&void 0===this.parsedJWS.sigvalH){var n=e.match(/^([^.]+)\.([^.]+)\.([^.]+)$/);if(null==n)throw "JWS signature is not a form of 'Head.Payload.SigValue'.";var i=n[1],o=n[2],s=n[3],a=i+"."+o;if(this.parsedJWS={},this.parsedJWS.headB64U=i,this.parsedJWS.payloadB64U=o,this.parsedJWS.sigvalB64U=s,this.parsedJWS.si=a,!r){var u=Lr(s),c=Ke(u,16);this.parsedJWS.sigvalH=u,this.parsedJWS.sigvalBI=c;}var h=kr(i),l=kr(o);if(this.parsedJWS.headS=h,this.parsedJWS.payloadS=l,!t(h,this.parsedJWS,"headP"))throw "malformed JSON string for JWS Head: "+h}};},Er.jws.JWS.sign=function(t,e,n,i,o){var s,a,u,c=Er,h=c.jws.JWS,l=h.readSafeJSONString,f=h.isSafeJSONString,d=c.crypto,g=(d.ECDSA,d.Mac),p=d.Signature,v=JSON;if("string"!=typeof e&&"object"!=(void 0===e?"undefined":r(e)))throw "spHeader must be JSON string or object: "+e;if("object"==(void 0===e?"undefined":r(e))&&(a=e,s=v.stringify(a)),"string"==typeof e){if(!f(s=e))throw "JWS Head is not safe JSON string: "+s;a=l(s);}if(u=n,"object"==(void 0===n?"undefined":r(n))&&(u=v.stringify(n)),""!=t&&null!=t||void 0===a.alg||(t=a.alg),""!=t&&null!=t&&void 0===a.alg&&(a.alg=t,s=v.stringify(a)),t!==a.alg)throw "alg and sHeader.alg doesn't match: "+t+"!="+a.alg;var y=null;if(void 0===h.jwsalg2sigalg[t])throw "unsupported alg name: "+t;y=h.jwsalg2sigalg[t];var m=xr(s)+"."+xr(u),_="";if("Hmac"==y.substr(0,4)){if(void 0===i)throw "mac key shall be specified for HS* alg";var S=new g({alg:y,prov:"cryptojs",pass:i});S.updateString(m),_=S.doFinal();}else {var F;if(-1!=y.indexOf("withECDSA"))(F=new p({alg:y})).init(i,o),F.updateString(m),hASN1Sig=F.sign(),_=Er.crypto.ECDSA.asn1SigToConcatSig(hASN1Sig);else if("none"!=y)(F=new p({alg:y})).init(i,o),F.updateString(m),_=F.sign();}return m+"."+Ur(_)},Er.jws.JWS.verify=function(t,e,n){var i,o=Er,s=o.jws.JWS,a=s.readSafeJSONString,u=o.crypto,c=u.ECDSA,h=u.Mac,l=u.Signature;void 0!==r(qe)&&(i=qe);var f=t.split(".");if(3!==f.length)return !1;var d=f[0]+"."+f[1],g=Lr(f[2]),p=a(kr(f[0])),v=null,y=null;if(void 0===p.alg)throw "algorithm not specified in header";if((y=(v=p.alg).substr(0,2),null!=n&&"[object Array]"===Object.prototype.toString.call(n)&&n.length>0)&&-1==(":"+n.join(":")+":").indexOf(":"+v+":"))throw "algorithm '"+v+"' not accepted in the list";if("none"!=v&&null===e)throw "key shall be specified to verify.";if("string"==typeof e&&-1!=e.indexOf("-----BEGIN ")&&(e=tn.getKey(e)),!("RS"!=y&&"PS"!=y||e instanceof i))throw "key shall be a RSAKey obj for RS* and PS* algs";if("ES"==y&&!(e instanceof c))throw "key shall be a ECDSA obj for ES* algs";var m=null;if(void 0===s.jwsalg2sigalg[p.alg])throw "unsupported alg name: "+v;if("none"==(m=s.jwsalg2sigalg[v]))throw "not supported";if("Hmac"==m.substr(0,4)){if(void 0===e)throw "hexadecimal key shall be specified for HMAC";var _=new h({alg:m,pass:e});return _.updateString(d),g==_.doFinal()}if(-1!=m.indexOf("withECDSA")){var S,F=null;try{F=c.concatSigToASN1Sig(g);}catch(t){return !1}return (S=new l({alg:m})).init(e),S.updateString(d),S.verify(F)}return (S=new l({alg:m})).init(e),S.updateString(d),S.verify(g)},Er.jws.JWS.parse=function(t){var e,r,n,i=t.split("."),o={};if(2!=i.length&&3!=i.length)throw "malformed sJWS: wrong number of '.' splitted elements";return e=i[0],r=i[1],3==i.length&&(n=i[2]),o.headerObj=Er.jws.JWS.readSafeJSONString(kr(e)),o.payloadObj=Er.jws.JWS.readSafeJSONString(kr(r)),o.headerPP=JSON.stringify(o.headerObj,null,"  "),null==o.payloadObj?o.payloadPP=kr(r):o.payloadPP=JSON.stringify(o.payloadObj,null,"  "),void 0!==n&&(o.sigHex=Lr(n)),o},Er.jws.JWS.verifyJWT=function(t,e,n){var i=Er.jws,o=i.JWS,s=o.readSafeJSONString,a=o.inArray,u=o.includedArray,c=t.split("."),h=c[0],l=c[1],f=(Lr(c[2]),s(kr(h))),d=s(kr(l));if(void 0===f.alg)return !1;if(void 0===n.alg)throw "acceptField.alg shall be specified";if(!a(f.alg,n.alg))return !1;if(void 0!==d.iss&&"object"===r(n.iss)&&!a(d.iss,n.iss))return !1;if(void 0!==d.sub&&"object"===r(n.sub)&&!a(d.sub,n.sub))return !1;if(void 0!==d.aud&&"object"===r(n.aud))if("string"==typeof d.aud){if(!a(d.aud,n.aud))return !1}else if("object"==r(d.aud)&&!u(d.aud,n.aud))return !1;var g=i.IntDate.getNow();return void 0!==n.verifyAt&&"number"==typeof n.verifyAt&&(g=n.verifyAt),void 0!==n.gracePeriod&&"number"==typeof n.gracePeriod||(n.gracePeriod=0),!(void 0!==d.exp&&"number"==typeof d.exp&&d.exp+n.gracePeriod<g)&&(!(void 0!==d.nbf&&"number"==typeof d.nbf&&g<d.nbf-n.gracePeriod)&&(!(void 0!==d.iat&&"number"==typeof d.iat&&g<d.iat-n.gracePeriod)&&((void 0===d.jti||void 0===n.jti||d.jti===n.jti)&&!!o.verify(t,e,n.alg))))},Er.jws.JWS.includedArray=function(t,e){var n=Er.jws.JWS.inArray;if(null===t)return !1;if("object"!==(void 0===t?"undefined":r(t)))return !1;if("number"!=typeof t.length)return !1;for(var i=0;i<t.length;i++)if(!n(t[i],e))return !1;return !0},Er.jws.JWS.inArray=function(t,e){if(null===e)return !1;if("object"!==(void 0===e?"undefined":r(e)))return !1;if("number"!=typeof e.length)return !1;for(var n=0;n<e.length;n++)if(e[n]==t)return !0;return !1},Er.jws.JWS.jwsalg2sigalg={HS256:"HmacSHA256",HS384:"HmacSHA384",HS512:"HmacSHA512",RS256:"SHA256withRSA",RS384:"SHA384withRSA",RS512:"SHA512withRSA",ES256:"SHA256withECDSA",ES384:"SHA384withECDSA",PS256:"SHA256withRSAandMGF1",PS384:"SHA384withRSAandMGF1",PS512:"SHA512withRSAandMGF1",none:"none"},Er.jws.JWS.isSafeJSONString=function(t,e,n){var i=null;try{return "object"!=(void 0===(i=wr(t))?"undefined":r(i))?0:i.constructor===Array?0:(e&&(e[n]=i),1)}catch(t){return 0}},Er.jws.JWS.readSafeJSONString=function(t){var e=null;try{return "object"!=(void 0===(e=wr(t))?"undefined":r(e))?null:e.constructor===Array?null:e}catch(t){return null}},Er.jws.JWS.getEncodedSignatureValueFromJWS=function(t){var e=t.match(/^[^.]+\.[^.]+\.([^.]+)$/);if(null==e)throw "JWS signature is not a form of 'Head.Payload.SigValue'.";return e[1]},Er.jws.JWS.getJWKthumbprint=function(t){if("RSA"!==t.kty&&"EC"!==t.kty&&"oct"!==t.kty)throw "unsupported algorithm for JWK Thumprint";var e="{";if("RSA"===t.kty){if("string"!=typeof t.n||"string"!=typeof t.e)throw "wrong n and e value for RSA key";e+='"e":"'+t.e+'",',e+='"kty":"'+t.kty+'",',e+='"n":"'+t.n+'"}';}else if("EC"===t.kty){if("string"!=typeof t.crv||"string"!=typeof t.x||"string"!=typeof t.y)throw "wrong crv, x and y value for EC key";e+='"crv":"'+t.crv+'",',e+='"kty":"'+t.kty+'",',e+='"x":"'+t.x+'",',e+='"y":"'+t.y+'"}';}else if("oct"===t.kty){if("string"!=typeof t.k)throw "wrong k value for oct(symmetric) key";e+='"kty":"'+t.kty+'",',e+='"k":"'+t.k+'"}';}var r=jr(e);return Ur(Er.crypto.Util.hashHex(r,"sha256"))},Er.jws.IntDate={},Er.jws.IntDate.get=function(t){var e=Er.jws.IntDate,r=e.getNow,n=e.getZulu;if("now"==t)return r();if("now + 1hour"==t)return r()+3600;if("now + 1day"==t)return r()+86400;if("now + 1month"==t)return r()+2592e3;if("now + 1year"==t)return r()+31536e3;if(t.match(/Z$/))return n(t);if(t.match(/^[0-9]+$/))return parseInt(t);throw "unsupported format: "+t},Er.jws.IntDate.getZulu=function(t){return Wr(t)},Er.jws.IntDate.getNow=function(){return ~~(new Date/1e3)},Er.jws.IntDate.intDate2UTCString=function(t){return new Date(1e3*t).toUTCString()},Er.jws.IntDate.intDate2Zulu=function(t){var e=new Date(1e3*t);return ("0000"+e.getUTCFullYear()).slice(-4)+("00"+(e.getUTCMonth()+1)).slice(-2)+("00"+e.getUTCDate()).slice(-2)+("00"+e.getUTCHours()).slice(-2)+("00"+e.getUTCMinutes()).slice(-2)+("00"+e.getUTCSeconds()).slice(-2)+"Z"},e.SecureRandom=Me,e.rng_seed_time=Le,e.BigInteger=E,e.RSAKey=qe;var an=Er.crypto.EDSA;e.EDSA=an;var un=Er.crypto.DSA;e.DSA=un;var cn=Er.crypto.Signature;e.Signature=cn;var hn=Er.crypto.MessageDigest;e.MessageDigest=hn;var ln=Er.crypto.Mac;e.Mac=ln;var fn=Er.crypto.Cipher;e.Cipher=fn,e.KEYUTIL=tn,e.ASN1HEX=Ar,e.X509=sn,e.CryptoJS=y,e.b64tohex=b,e.b64toBA=w,e.stoBA=Pr,e.BAtos=Cr,e.BAtohex=Tr,e.stohex=Rr,e.stob64=function dn(t){return F(Rr(t))},e.stob64u=function gn(t){return Ir(F(Rr(t)))},e.b64utos=function pn(t){return Cr(w(Dr(t)))},e.b64tob64u=Ir,e.b64utob64=Dr,e.hex2b64=F,e.hextob64u=Ur,e.b64utohex=Lr,e.utf8tob64u=xr,e.b64utoutf8=kr,e.utf8tob64=function vn(t){return F(zr($r(t)))},e.b64toutf8=function yn(t){return decodeURIComponent(Yr(b(t)))},e.utf8tohex=Br,e.hextoutf8=Nr,e.hextorstr=Or,e.rstrtohex=jr,e.hextob64=Hr,e.hextob64nl=Mr,e.b64nltohex=Kr,e.hextopem=Vr,e.pemtohex=qr,e.hextoArrayBuffer=function mn(t){if(t.length%2!=0)throw "input is not even length";if(null==t.match(/^[0-9A-Fa-f]+$/))throw "input is not hexadecimal";for(var e=new ArrayBuffer(t.length/2),r=new DataView(e),n=0;n<t.length/2;n++)r.setUint8(n,parseInt(t.substr(2*n,2),16));return e},e.ArrayBuffertohex=function _n(t){for(var e="",r=new DataView(t),n=0;n<t.byteLength;n++)e+=("00"+r.getUint8(n).toString(16)).slice(-2);return e},e.zulutomsec=Jr,e.zulutosec=Wr,e.zulutodate=function Sn(t){return new Date(Jr(t))},e.datetozulu=function Fn(t,e,r){var n,i=t.getUTCFullYear();if(e){if(i<1950||2049<i)throw "not proper year for UTCTime: "+i;n=(""+i).slice(-2);}else n=("000"+i).slice(-4);if(n+=("0"+(t.getUTCMonth()+1)).slice(-2),n+=("0"+t.getUTCDate()).slice(-2),n+=("0"+t.getUTCHours()).slice(-2),n+=("0"+t.getUTCMinutes()).slice(-2),n+=("0"+t.getUTCSeconds()).slice(-2),r){var o=t.getUTCMilliseconds();0!==o&&(n+="."+(o=(o=("00"+o).slice(-3)).replace(/0+$/g,"")));}return n+="Z"},e.uricmptohex=zr,e.hextouricmp=Yr,e.ipv6tohex=Gr,e.hextoipv6=Xr,e.hextoip=Qr,e.iptohex=function bn(t){var e="malformed IP address";if(!(t=t.toLowerCase(t)).match(/^[0-9.]+$/)){if(t.match(/^[0-9a-f:]+$/)&&-1!==t.indexOf(":"))return Gr(t);throw e}var r=t.split(".");if(4!==r.length)throw e;var n="";try{for(var i=0;i<4;i++)n+=("0"+parseInt(r[i]).toString(16)).slice(-2);return n}catch(t){throw e}},e.encodeURIComponentAll=$r,e.newline_toUnix=function wn(t){return t=t.replace(/\r\n/gm,"\n")},e.newline_toDos=function En(t){return t=(t=t.replace(/\r\n/gm,"\n")).replace(/\n/gm,"\r\n")},e.hextoposhex=Zr,e.intarystrtohex=function xn(t){t=(t=(t=t.replace(/^\s*\[\s*/,"")).replace(/\s*\]\s*$/,"")).replace(/\s*/g,"");try{return t.split(/,/).map(function(t,e,r){var n=parseInt(t);if(n<0||255<n)throw "integer not in range 0-255";return ("00"+n.toString(16)).slice(-2)}).join("")}catch(t){throw "malformed integer array string: "+t}},e.strdiffidx=function t(e,r){var n=e.length;e.length>r.length&&(n=r.length);for(var i=0;i<n;i++)if(e.charCodeAt(i)!=r.charCodeAt(i))return i;return e.length!=r.length?n:-1},e.KJUR=Er;var kn=Er.crypto;e.crypto=kn;var An=Er.asn1;e.asn1=An;var Pn=Er.jws;e.jws=Pn;var Cn=Er.lang;e.lang=Cn;}).call(this,r(27).Buffer);},function(t,e,r){(function(t){
    /*!
     * The buffer module from node.js, for the browser.
     *
     * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
     * @license  MIT
     */
    var n=r(29),i=r(30),o=r(31);function s(){return u.TYPED_ARRAY_SUPPORT?2147483647:1073741823}function a(t,e){if(s()<e)throw new RangeError("Invalid typed array length");return u.TYPED_ARRAY_SUPPORT?(t=new Uint8Array(e)).__proto__=u.prototype:(null===t&&(t=new u(e)),t.length=e),t}function u(t,e,r){if(!(u.TYPED_ARRAY_SUPPORT||this instanceof u))return new u(t,e,r);if("number"==typeof t){if("string"==typeof e)throw new Error("If encoding is specified then the first argument must be a string");return l(this,t)}return c(this,t,e,r)}function c(t,e,r,n){if("number"==typeof e)throw new TypeError('"value" argument must not be a number');return "undefined"!=typeof ArrayBuffer&&e instanceof ArrayBuffer?function i(t,e,r,n){if(e.byteLength,r<0||e.byteLength<r)throw new RangeError("'offset' is out of bounds");if(e.byteLength<r+(n||0))throw new RangeError("'length' is out of bounds");e=void 0===r&&void 0===n?new Uint8Array(e):void 0===n?new Uint8Array(e,r):new Uint8Array(e,r,n);u.TYPED_ARRAY_SUPPORT?(t=e).__proto__=u.prototype:t=f(t,e);return t}(t,e,r,n):"string"==typeof e?function s(t,e,r){"string"==typeof r&&""!==r||(r="utf8");if(!u.isEncoding(r))throw new TypeError('"encoding" must be a valid string encoding');var n=0|g(e,r),i=(t=a(t,n)).write(e,r);i!==n&&(t=t.slice(0,i));return t}(t,e,r):function c(t,e){if(u.isBuffer(e)){var r=0|d(e.length);return 0===(t=a(t,r)).length?t:(e.copy(t,0,0,r),t)}if(e){if("undefined"!=typeof ArrayBuffer&&e.buffer instanceof ArrayBuffer||"length"in e)return "number"!=typeof e.length||function n(t){return t!=t}(e.length)?a(t,0):f(t,e);if("Buffer"===e.type&&o(e.data))return f(t,e.data)}throw new TypeError("First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.")}(t,e)}function h(t){if("number"!=typeof t)throw new TypeError('"size" argument must be a number');if(t<0)throw new RangeError('"size" argument must not be negative')}function l(t,e){if(h(e),t=a(t,e<0?0:0|d(e)),!u.TYPED_ARRAY_SUPPORT)for(var r=0;r<e;++r)t[r]=0;return t}function f(t,e){var r=e.length<0?0:0|d(e.length);t=a(t,r);for(var n=0;n<r;n+=1)t[n]=255&e[n];return t}function d(t){if(t>=s())throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x"+s().toString(16)+" bytes");return 0|t}function g(t,e){if(u.isBuffer(t))return t.length;if("undefined"!=typeof ArrayBuffer&&"function"==typeof ArrayBuffer.isView&&(ArrayBuffer.isView(t)||t instanceof ArrayBuffer))return t.byteLength;"string"!=typeof t&&(t=""+t);var r=t.length;if(0===r)return 0;for(var n=!1;;)switch(e){case"ascii":case"latin1":case"binary":return r;case"utf8":case"utf-8":case void 0:return K(t).length;case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return 2*r;case"hex":return r>>>1;case"base64":return V(t).length;default:if(n)return K(t).length;e=(""+e).toLowerCase(),n=!0;}}function p(t,e,r){var n=t[e];t[e]=t[r],t[r]=n;}function v(t,e,r,n,i){if(0===t.length)return -1;if("string"==typeof r?(n=r,r=0):r>2147483647?r=2147483647:r<-2147483648&&(r=-2147483648),r=+r,isNaN(r)&&(r=i?0:t.length-1),r<0&&(r=t.length+r),r>=t.length){if(i)return -1;r=t.length-1;}else if(r<0){if(!i)return -1;r=0;}if("string"==typeof e&&(e=u.from(e,n)),u.isBuffer(e))return 0===e.length?-1:y(t,e,r,n,i);if("number"==typeof e)return e&=255,u.TYPED_ARRAY_SUPPORT&&"function"==typeof Uint8Array.prototype.indexOf?i?Uint8Array.prototype.indexOf.call(t,e,r):Uint8Array.prototype.lastIndexOf.call(t,e,r):y(t,[e],r,n,i);throw new TypeError("val must be string, number or Buffer")}function y(t,e,r,n,i){var o,s=1,a=t.length,u=e.length;if(void 0!==n&&("ucs2"===(n=String(n).toLowerCase())||"ucs-2"===n||"utf16le"===n||"utf-16le"===n)){if(t.length<2||e.length<2)return -1;s=2,a/=2,u/=2,r/=2;}function c(t,e){return 1===s?t[e]:t.readUInt16BE(e*s)}if(i){var h=-1;for(o=r;o<a;o++)if(c(t,o)===c(e,-1===h?0:o-h)){if(-1===h&&(h=o),o-h+1===u)return h*s}else -1!==h&&(o-=o-h),h=-1;}else for(r+u>a&&(r=a-u),o=r;o>=0;o--){for(var l=!0,f=0;f<u;f++)if(c(t,o+f)!==c(e,f)){l=!1;break}if(l)return o}return -1}function m(t,e,r,n){r=Number(r)||0;var i=t.length-r;n?(n=Number(n))>i&&(n=i):n=i;var o=e.length;if(o%2!=0)throw new TypeError("Invalid hex string");n>o/2&&(n=o/2);for(var s=0;s<n;++s){var a=parseInt(e.substr(2*s,2),16);if(isNaN(a))return s;t[r+s]=a;}return s}function _(t,e,r,n){return q(K(e,t.length-r),t,r,n)}function S(t,e,r,n){return q(function i(t){for(var e=[],r=0;r<t.length;++r)e.push(255&t.charCodeAt(r));return e}(e),t,r,n)}function F(t,e,r,n){return S(t,e,r,n)}function b(t,e,r,n){return q(V(e),t,r,n)}function w(t,e,r,n){return q(function i(t,e){for(var r,n,i,o=[],s=0;s<t.length&&!((e-=2)<0);++s)r=t.charCodeAt(s),n=r>>8,i=r%256,o.push(i),o.push(n);return o}(e,t.length-r),t,r,n)}function E(t,e,r){return 0===e&&r===t.length?n.fromByteArray(t):n.fromByteArray(t.slice(e,r))}function x(t,e,r){r=Math.min(t.length,r);for(var n=[],i=e;i<r;){var o,s,a,u,c=t[i],h=null,l=c>239?4:c>223?3:c>191?2:1;if(i+l<=r)switch(l){case 1:c<128&&(h=c);break;case 2:128==(192&(o=t[i+1]))&&(u=(31&c)<<6|63&o)>127&&(h=u);break;case 3:o=t[i+1],s=t[i+2],128==(192&o)&&128==(192&s)&&(u=(15&c)<<12|(63&o)<<6|63&s)>2047&&(u<55296||u>57343)&&(h=u);break;case 4:o=t[i+1],s=t[i+2],a=t[i+3],128==(192&o)&&128==(192&s)&&128==(192&a)&&(u=(15&c)<<18|(63&o)<<12|(63&s)<<6|63&a)>65535&&u<1114112&&(h=u);}null===h?(h=65533,l=1):h>65535&&(h-=65536,n.push(h>>>10&1023|55296),h=56320|1023&h),n.push(h),i+=l;}return function f(t){var e=t.length;if(e<=P)return String.fromCharCode.apply(String,t);var r="",n=0;for(;n<e;)r+=String.fromCharCode.apply(String,t.slice(n,n+=P));return r}(n)}e.Buffer=u,e.SlowBuffer=function k(t){+t!=t&&(t=0);return u.alloc(+t)},e.INSPECT_MAX_BYTES=50,u.TYPED_ARRAY_SUPPORT=void 0!==t.TYPED_ARRAY_SUPPORT?t.TYPED_ARRAY_SUPPORT:function A(){try{var t=new Uint8Array(1);return t.__proto__={__proto__:Uint8Array.prototype,foo:function(){return 42}},42===t.foo()&&"function"==typeof t.subarray&&0===t.subarray(1,1).byteLength}catch(t){return !1}}(),e.kMaxLength=s(),u.poolSize=8192,u._augment=function(t){return t.__proto__=u.prototype,t},u.from=function(t,e,r){return c(null,t,e,r)},u.TYPED_ARRAY_SUPPORT&&(u.prototype.__proto__=Uint8Array.prototype,u.__proto__=Uint8Array,"undefined"!=typeof Symbol&&Symbol.species&&u[Symbol.species]===u&&Object.defineProperty(u,Symbol.species,{value:null,configurable:!0})),u.alloc=function(t,e,r){return function n(t,e,r,i){return h(e),e<=0?a(t,e):void 0!==r?"string"==typeof i?a(t,e).fill(r,i):a(t,e).fill(r):a(t,e)}(null,t,e,r)},u.allocUnsafe=function(t){return l(null,t)},u.allocUnsafeSlow=function(t){return l(null,t)},u.isBuffer=function t(e){return !(null==e||!e._isBuffer)},u.compare=function t(e,r){if(!u.isBuffer(e)||!u.isBuffer(r))throw new TypeError("Arguments must be Buffers");if(e===r)return 0;for(var n=e.length,i=r.length,o=0,s=Math.min(n,i);o<s;++o)if(e[o]!==r[o]){n=e[o],i=r[o];break}return n<i?-1:i<n?1:0},u.isEncoding=function t(e){switch(String(e).toLowerCase()){case"hex":case"utf8":case"utf-8":case"ascii":case"latin1":case"binary":case"base64":case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return !0;default:return !1}},u.concat=function t(e,r){if(!o(e))throw new TypeError('"list" argument must be an Array of Buffers');if(0===e.length)return u.alloc(0);var n;if(void 0===r)for(r=0,n=0;n<e.length;++n)r+=e[n].length;var i=u.allocUnsafe(r),s=0;for(n=0;n<e.length;++n){var a=e[n];if(!u.isBuffer(a))throw new TypeError('"list" argument must be an Array of Buffers');a.copy(i,s),s+=a.length;}return i},u.byteLength=g,u.prototype._isBuffer=!0,u.prototype.swap16=function t(){var e=this.length;if(e%2!=0)throw new RangeError("Buffer size must be a multiple of 16-bits");for(var r=0;r<e;r+=2)p(this,r,r+1);return this},u.prototype.swap32=function t(){var e=this.length;if(e%4!=0)throw new RangeError("Buffer size must be a multiple of 32-bits");for(var r=0;r<e;r+=4)p(this,r,r+3),p(this,r+1,r+2);return this},u.prototype.swap64=function t(){var e=this.length;if(e%8!=0)throw new RangeError("Buffer size must be a multiple of 64-bits");for(var r=0;r<e;r+=8)p(this,r,r+7),p(this,r+1,r+6),p(this,r+2,r+5),p(this,r+3,r+4);return this},u.prototype.toString=function t(){var e=0|this.length;return 0===e?"":0===arguments.length?x(this,0,e):function r(t,e,n){var i=!1;if((void 0===e||e<0)&&(e=0),e>this.length)return "";if((void 0===n||n>this.length)&&(n=this.length),n<=0)return "";if((n>>>=0)<=(e>>>=0))return "";for(t||(t="utf8");;)switch(t){case"hex":return R(this,e,n);case"utf8":case"utf-8":return x(this,e,n);case"ascii":return C(this,e,n);case"latin1":case"binary":return T(this,e,n);case"base64":return E(this,e,n);case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return I(this,e,n);default:if(i)throw new TypeError("Unknown encoding: "+t);t=(t+"").toLowerCase(),i=!0;}}.apply(this,arguments)},u.prototype.equals=function t(e){if(!u.isBuffer(e))throw new TypeError("Argument must be a Buffer");return this===e||0===u.compare(this,e)},u.prototype.inspect=function t(){var r="",n=e.INSPECT_MAX_BYTES;return this.length>0&&(r=this.toString("hex",0,n).match(/.{2}/g).join(" "),this.length>n&&(r+=" ... ")),"<Buffer "+r+">"},u.prototype.compare=function t(e,r,n,i,o){if(!u.isBuffer(e))throw new TypeError("Argument must be a Buffer");if(void 0===r&&(r=0),void 0===n&&(n=e?e.length:0),void 0===i&&(i=0),void 0===o&&(o=this.length),r<0||n>e.length||i<0||o>this.length)throw new RangeError("out of range index");if(i>=o&&r>=n)return 0;if(i>=o)return -1;if(r>=n)return 1;if(r>>>=0,n>>>=0,i>>>=0,o>>>=0,this===e)return 0;for(var s=o-i,a=n-r,c=Math.min(s,a),h=this.slice(i,o),l=e.slice(r,n),f=0;f<c;++f)if(h[f]!==l[f]){s=h[f],a=l[f];break}return s<a?-1:a<s?1:0},u.prototype.includes=function t(e,r,n){return -1!==this.indexOf(e,r,n)},u.prototype.indexOf=function t(e,r,n){return v(this,e,r,n,!0)},u.prototype.lastIndexOf=function t(e,r,n){return v(this,e,r,n,!1)},u.prototype.write=function t(e,r,n,i){if(void 0===r)i="utf8",n=this.length,r=0;else if(void 0===n&&"string"==typeof r)i=r,n=this.length,r=0;else {if(!isFinite(r))throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");r|=0,isFinite(n)?(n|=0,void 0===i&&(i="utf8")):(i=n,n=void 0);}var o=this.length-r;if((void 0===n||n>o)&&(n=o),e.length>0&&(n<0||r<0)||r>this.length)throw new RangeError("Attempt to write outside buffer bounds");i||(i="utf8");for(var s=!1;;)switch(i){case"hex":return m(this,e,r,n);case"utf8":case"utf-8":return _(this,e,r,n);case"ascii":return S(this,e,r,n);case"latin1":case"binary":return F(this,e,r,n);case"base64":return b(this,e,r,n);case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return w(this,e,r,n);default:if(s)throw new TypeError("Unknown encoding: "+i);i=(""+i).toLowerCase(),s=!0;}},u.prototype.toJSON=function t(){return {type:"Buffer",data:Array.prototype.slice.call(this._arr||this,0)}};var P=4096;function C(t,e,r){var n="";r=Math.min(t.length,r);for(var i=e;i<r;++i)n+=String.fromCharCode(127&t[i]);return n}function T(t,e,r){var n="";r=Math.min(t.length,r);for(var i=e;i<r;++i)n+=String.fromCharCode(t[i]);return n}function R(t,e,r){var n=t.length;(!e||e<0)&&(e=0),(!r||r<0||r>n)&&(r=n);for(var i="",o=e;o<r;++o)i+=M(t[o]);return i}function I(t,e,r){for(var n=t.slice(e,r),i="",o=0;o<n.length;o+=2)i+=String.fromCharCode(n[o]+256*n[o+1]);return i}function D(t,e,r){if(t%1!=0||t<0)throw new RangeError("offset is not uint");if(t+e>r)throw new RangeError("Trying to access beyond buffer length")}function U(t,e,r,n,i,o){if(!u.isBuffer(t))throw new TypeError('"buffer" argument must be a Buffer instance');if(e>i||e<o)throw new RangeError('"value" argument is out of bounds');if(r+n>t.length)throw new RangeError("Index out of range")}function L(t,e,r,n){e<0&&(e=65535+e+1);for(var i=0,o=Math.min(t.length-r,2);i<o;++i)t[r+i]=(e&255<<8*(n?i:1-i))>>>8*(n?i:1-i);}function B(t,e,r,n){e<0&&(e=4294967295+e+1);for(var i=0,o=Math.min(t.length-r,4);i<o;++i)t[r+i]=e>>>8*(n?i:3-i)&255;}function N(t,e,r,n,i,o){if(r+n>t.length)throw new RangeError("Index out of range");if(r<0)throw new RangeError("Index out of range")}function O(t,e,r,n,o){return o||N(t,0,r,4),i.write(t,e,r,n,23,4),r+4}function j(t,e,r,n,o){return o||N(t,0,r,8),i.write(t,e,r,n,52,8),r+8}u.prototype.slice=function t(e,r){var n,i=this.length;if(e=~~e,r=void 0===r?i:~~r,e<0?(e+=i)<0&&(e=0):e>i&&(e=i),r<0?(r+=i)<0&&(r=0):r>i&&(r=i),r<e&&(r=e),u.TYPED_ARRAY_SUPPORT)(n=this.subarray(e,r)).__proto__=u.prototype;else {var o=r-e;n=new u(o,void 0);for(var s=0;s<o;++s)n[s]=this[s+e];}return n},u.prototype.readUIntLE=function t(e,r,n){e|=0,r|=0,n||D(e,r,this.length);for(var i=this[e],o=1,s=0;++s<r&&(o*=256);)i+=this[e+s]*o;return i},u.prototype.readUIntBE=function t(e,r,n){e|=0,r|=0,n||D(e,r,this.length);for(var i=this[e+--r],o=1;r>0&&(o*=256);)i+=this[e+--r]*o;return i},u.prototype.readUInt8=function t(e,r){return r||D(e,1,this.length),this[e]},u.prototype.readUInt16LE=function t(e,r){return r||D(e,2,this.length),this[e]|this[e+1]<<8},u.prototype.readUInt16BE=function t(e,r){return r||D(e,2,this.length),this[e]<<8|this[e+1]},u.prototype.readUInt32LE=function t(e,r){return r||D(e,4,this.length),(this[e]|this[e+1]<<8|this[e+2]<<16)+16777216*this[e+3]},u.prototype.readUInt32BE=function t(e,r){return r||D(e,4,this.length),16777216*this[e]+(this[e+1]<<16|this[e+2]<<8|this[e+3])},u.prototype.readIntLE=function t(e,r,n){e|=0,r|=0,n||D(e,r,this.length);for(var i=this[e],o=1,s=0;++s<r&&(o*=256);)i+=this[e+s]*o;return i>=(o*=128)&&(i-=Math.pow(2,8*r)),i},u.prototype.readIntBE=function t(e,r,n){e|=0,r|=0,n||D(e,r,this.length);for(var i=r,o=1,s=this[e+--i];i>0&&(o*=256);)s+=this[e+--i]*o;return s>=(o*=128)&&(s-=Math.pow(2,8*r)),s},u.prototype.readInt8=function t(e,r){return r||D(e,1,this.length),128&this[e]?-1*(255-this[e]+1):this[e]},u.prototype.readInt16LE=function t(e,r){r||D(e,2,this.length);var n=this[e]|this[e+1]<<8;return 32768&n?4294901760|n:n},u.prototype.readInt16BE=function t(e,r){r||D(e,2,this.length);var n=this[e+1]|this[e]<<8;return 32768&n?4294901760|n:n},u.prototype.readInt32LE=function t(e,r){return r||D(e,4,this.length),this[e]|this[e+1]<<8|this[e+2]<<16|this[e+3]<<24},u.prototype.readInt32BE=function t(e,r){return r||D(e,4,this.length),this[e]<<24|this[e+1]<<16|this[e+2]<<8|this[e+3]},u.prototype.readFloatLE=function t(e,r){return r||D(e,4,this.length),i.read(this,e,!0,23,4)},u.prototype.readFloatBE=function t(e,r){return r||D(e,4,this.length),i.read(this,e,!1,23,4)},u.prototype.readDoubleLE=function t(e,r){return r||D(e,8,this.length),i.read(this,e,!0,52,8)},u.prototype.readDoubleBE=function t(e,r){return r||D(e,8,this.length),i.read(this,e,!1,52,8)},u.prototype.writeUIntLE=function t(e,r,n,i){(e=+e,r|=0,n|=0,i)||U(this,e,r,n,Math.pow(2,8*n)-1,0);var o=1,s=0;for(this[r]=255&e;++s<n&&(o*=256);)this[r+s]=e/o&255;return r+n},u.prototype.writeUIntBE=function t(e,r,n,i){(e=+e,r|=0,n|=0,i)||U(this,e,r,n,Math.pow(2,8*n)-1,0);var o=n-1,s=1;for(this[r+o]=255&e;--o>=0&&(s*=256);)this[r+o]=e/s&255;return r+n},u.prototype.writeUInt8=function t(e,r,n){return e=+e,r|=0,n||U(this,e,r,1,255,0),u.TYPED_ARRAY_SUPPORT||(e=Math.floor(e)),this[r]=255&e,r+1},u.prototype.writeUInt16LE=function t(e,r,n){return e=+e,r|=0,n||U(this,e,r,2,65535,0),u.TYPED_ARRAY_SUPPORT?(this[r]=255&e,this[r+1]=e>>>8):L(this,e,r,!0),r+2},u.prototype.writeUInt16BE=function t(e,r,n){return e=+e,r|=0,n||U(this,e,r,2,65535,0),u.TYPED_ARRAY_SUPPORT?(this[r]=e>>>8,this[r+1]=255&e):L(this,e,r,!1),r+2},u.prototype.writeUInt32LE=function t(e,r,n){return e=+e,r|=0,n||U(this,e,r,4,4294967295,0),u.TYPED_ARRAY_SUPPORT?(this[r+3]=e>>>24,this[r+2]=e>>>16,this[r+1]=e>>>8,this[r]=255&e):B(this,e,r,!0),r+4},u.prototype.writeUInt32BE=function t(e,r,n){return e=+e,r|=0,n||U(this,e,r,4,4294967295,0),u.TYPED_ARRAY_SUPPORT?(this[r]=e>>>24,this[r+1]=e>>>16,this[r+2]=e>>>8,this[r+3]=255&e):B(this,e,r,!1),r+4},u.prototype.writeIntLE=function t(e,r,n,i){if(e=+e,r|=0,!i){var o=Math.pow(2,8*n-1);U(this,e,r,n,o-1,-o);}var s=0,a=1,u=0;for(this[r]=255&e;++s<n&&(a*=256);)e<0&&0===u&&0!==this[r+s-1]&&(u=1),this[r+s]=(e/a>>0)-u&255;return r+n},u.prototype.writeIntBE=function t(e,r,n,i){if(e=+e,r|=0,!i){var o=Math.pow(2,8*n-1);U(this,e,r,n,o-1,-o);}var s=n-1,a=1,u=0;for(this[r+s]=255&e;--s>=0&&(a*=256);)e<0&&0===u&&0!==this[r+s+1]&&(u=1),this[r+s]=(e/a>>0)-u&255;return r+n},u.prototype.writeInt8=function t(e,r,n){return e=+e,r|=0,n||U(this,e,r,1,127,-128),u.TYPED_ARRAY_SUPPORT||(e=Math.floor(e)),e<0&&(e=255+e+1),this[r]=255&e,r+1},u.prototype.writeInt16LE=function t(e,r,n){return e=+e,r|=0,n||U(this,e,r,2,32767,-32768),u.TYPED_ARRAY_SUPPORT?(this[r]=255&e,this[r+1]=e>>>8):L(this,e,r,!0),r+2},u.prototype.writeInt16BE=function t(e,r,n){return e=+e,r|=0,n||U(this,e,r,2,32767,-32768),u.TYPED_ARRAY_SUPPORT?(this[r]=e>>>8,this[r+1]=255&e):L(this,e,r,!1),r+2},u.prototype.writeInt32LE=function t(e,r,n){return e=+e,r|=0,n||U(this,e,r,4,2147483647,-2147483648),u.TYPED_ARRAY_SUPPORT?(this[r]=255&e,this[r+1]=e>>>8,this[r+2]=e>>>16,this[r+3]=e>>>24):B(this,e,r,!0),r+4},u.prototype.writeInt32BE=function t(e,r,n){return e=+e,r|=0,n||U(this,e,r,4,2147483647,-2147483648),e<0&&(e=4294967295+e+1),u.TYPED_ARRAY_SUPPORT?(this[r]=e>>>24,this[r+1]=e>>>16,this[r+2]=e>>>8,this[r+3]=255&e):B(this,e,r,!1),r+4},u.prototype.writeFloatLE=function t(e,r,n){return O(this,e,r,!0,n)},u.prototype.writeFloatBE=function t(e,r,n){return O(this,e,r,!1,n)},u.prototype.writeDoubleLE=function t(e,r,n){return j(this,e,r,!0,n)},u.prototype.writeDoubleBE=function t(e,r,n){return j(this,e,r,!1,n)},u.prototype.copy=function t(e,r,n,i){if(n||(n=0),i||0===i||(i=this.length),r>=e.length&&(r=e.length),r||(r=0),i>0&&i<n&&(i=n),i===n)return 0;if(0===e.length||0===this.length)return 0;if(r<0)throw new RangeError("targetStart out of bounds");if(n<0||n>=this.length)throw new RangeError("sourceStart out of bounds");if(i<0)throw new RangeError("sourceEnd out of bounds");i>this.length&&(i=this.length),e.length-r<i-n&&(i=e.length-r+n);var o,s=i-n;if(this===e&&n<r&&r<i)for(o=s-1;o>=0;--o)e[o+r]=this[o+n];else if(s<1e3||!u.TYPED_ARRAY_SUPPORT)for(o=0;o<s;++o)e[o+r]=this[o+n];else Uint8Array.prototype.set.call(e,this.subarray(n,n+s),r);return s},u.prototype.fill=function t(e,r,n,i){if("string"==typeof e){if("string"==typeof r?(i=r,r=0,n=this.length):"string"==typeof n&&(i=n,n=this.length),1===e.length){var o=e.charCodeAt(0);o<256&&(e=o);}if(void 0!==i&&"string"!=typeof i)throw new TypeError("encoding must be a string");if("string"==typeof i&&!u.isEncoding(i))throw new TypeError("Unknown encoding: "+i)}else "number"==typeof e&&(e&=255);if(r<0||this.length<r||this.length<n)throw new RangeError("Out of range index");if(n<=r)return this;var s;if(r>>>=0,n=void 0===n?this.length:n>>>0,e||(e=0),"number"==typeof e)for(s=r;s<n;++s)this[s]=e;else {var a=u.isBuffer(e)?e:K(new u(e,i).toString()),c=a.length;for(s=0;s<n-r;++s)this[s+r]=a[s%c];}return this};var H=/[^+\/0-9A-Za-z-_]/g;function M(t){return t<16?"0"+t.toString(16):t.toString(16)}function K(t,e){var r;e=e||1/0;for(var n=t.length,i=null,o=[],s=0;s<n;++s){if((r=t.charCodeAt(s))>55295&&r<57344){if(!i){if(r>56319){(e-=3)>-1&&o.push(239,191,189);continue}if(s+1===n){(e-=3)>-1&&o.push(239,191,189);continue}i=r;continue}if(r<56320){(e-=3)>-1&&o.push(239,191,189),i=r;continue}r=65536+(i-55296<<10|r-56320);}else i&&(e-=3)>-1&&o.push(239,191,189);if(i=null,r<128){if((e-=1)<0)break;o.push(r);}else if(r<2048){if((e-=2)<0)break;o.push(r>>6|192,63&r|128);}else if(r<65536){if((e-=3)<0)break;o.push(r>>12|224,r>>6&63|128,63&r|128);}else {if(!(r<1114112))throw new Error("Invalid code point");if((e-=4)<0)break;o.push(r>>18|240,r>>12&63|128,r>>6&63|128,63&r|128);}}return o}function V(t){return n.toByteArray(function e(t){if((t=function e(t){return t.trim?t.trim():t.replace(/^\s+|\s+$/g,"")}(t).replace(H,"")).length<2)return "";for(;t.length%4!=0;)t+="=";return t}(t))}function q(t,e,r,n){for(var i=0;i<n&&!(i+r>=e.length||i>=t.length);++i)e[i+r]=t[i];return i}}).call(this,r(28));},function(t,e){var r;r=function(){return this}();try{r=r||new Function("return this")();}catch(t){"object"==typeof window&&(r=window);}t.exports=r;},function(t,e,r){e.byteLength=function n(t){var e=f(t),r=e[0],n=e[1];return 3*(r+n)/4-n},e.toByteArray=function i(t){for(var e,r=f(t),n=r[0],i=r[1],o=new u(function s(t,e,r){return 3*(e+r)/4-r}(0,n,i)),c=0,h=i>0?n-4:n,l=0;l<h;l+=4)e=a[t.charCodeAt(l)]<<18|a[t.charCodeAt(l+1)]<<12|a[t.charCodeAt(l+2)]<<6|a[t.charCodeAt(l+3)],o[c++]=e>>16&255,o[c++]=e>>8&255,o[c++]=255&e;2===i&&(e=a[t.charCodeAt(l)]<<2|a[t.charCodeAt(l+1)]>>4,o[c++]=255&e);1===i&&(e=a[t.charCodeAt(l)]<<10|a[t.charCodeAt(l+1)]<<4|a[t.charCodeAt(l+2)]>>2,o[c++]=e>>8&255,o[c++]=255&e);return o},e.fromByteArray=function o(t){for(var e,r=t.length,n=r%3,i=[],o=0,a=r-n;o<a;o+=16383)i.push(d(t,o,o+16383>a?a:o+16383));1===n?(e=t[r-1],i.push(s[e>>2]+s[e<<4&63]+"==")):2===n&&(e=(t[r-2]<<8)+t[r-1],i.push(s[e>>10]+s[e>>4&63]+s[e<<2&63]+"="));return i.join("")};for(var s=[],a=[],u="undefined"!=typeof Uint8Array?Uint8Array:Array,c="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",h=0,l=c.length;h<l;++h)s[h]=c[h],a[c.charCodeAt(h)]=h;function f(t){var e=t.length;if(e%4>0)throw new Error("Invalid string. Length must be a multiple of 4");var r=t.indexOf("=");return -1===r&&(r=e),[r,r===e?0:4-r%4]}function d(t,e,r){for(var n,i,o=[],a=e;a<r;a+=3)n=(t[a]<<16&16711680)+(t[a+1]<<8&65280)+(255&t[a+2]),o.push(s[(i=n)>>18&63]+s[i>>12&63]+s[i>>6&63]+s[63&i]);return o.join("")}a["-".charCodeAt(0)]=62,a["_".charCodeAt(0)]=63;},function(t,e){e.read=function(t,e,r,n,i){var o,s,a=8*i-n-1,u=(1<<a)-1,c=u>>1,h=-7,l=r?i-1:0,f=r?-1:1,d=t[e+l];for(l+=f,o=d&(1<<-h)-1,d>>=-h,h+=a;h>0;o=256*o+t[e+l],l+=f,h-=8);for(s=o&(1<<-h)-1,o>>=-h,h+=n;h>0;s=256*s+t[e+l],l+=f,h-=8);if(0===o)o=1-c;else {if(o===u)return s?NaN:1/0*(d?-1:1);s+=Math.pow(2,n),o-=c;}return (d?-1:1)*s*Math.pow(2,o-n)},e.write=function(t,e,r,n,i,o){var s,a,u,c=8*o-i-1,h=(1<<c)-1,l=h>>1,f=23===i?Math.pow(2,-24)-Math.pow(2,-77):0,d=n?0:o-1,g=n?1:-1,p=e<0||0===e&&1/e<0?1:0;for(e=Math.abs(e),isNaN(e)||e===1/0?(a=isNaN(e)?1:0,s=h):(s=Math.floor(Math.log(e)/Math.LN2),e*(u=Math.pow(2,-s))<1&&(s--,u*=2),(e+=s+l>=1?f/u:f*Math.pow(2,1-l))*u>=2&&(s++,u/=2),s+l>=h?(a=0,s=h):s+l>=1?(a=(e*u-1)*Math.pow(2,i),s+=l):(a=e*Math.pow(2,l-1)*Math.pow(2,i),s=0));i>=8;t[r+d]=255&a,d+=g,a/=256,i-=8);for(s=s<<i|a,c+=i;c>0;t[r+d]=255&s,d+=g,s/=256,c-=8);t[r+d-g]|=128*p;};},function(t,e){var r={}.toString;t.exports=Array.isArray||function(t){return "[object Array]"==r.call(t)};},function(t,e,r){Object.defineProperty(e,"__esModule",{value:!0}),e.default=function n(t){var e=t.jws,r=t.KeyUtil,n=t.X509,o=t.crypto,s=t.hextob64u,a=t.b64tohex,u=t.AllowedSigningAlgs;return function(){function t(){!function e(t,r){if(!(t instanceof r))throw new TypeError("Cannot call a class as a function")}(this,t);}return t.parseJwt=function t(r){i.Log.debug("JoseUtil.parseJwt");try{var n=e.JWS.parse(r);return {header:n.headerObj,payload:n.payloadObj}}catch(t){i.Log.error(t);}},t.validateJwt=function e(o,s,u,c,h,l,f){i.Log.debug("JoseUtil.validateJwt");try{if("RSA"===s.kty)if(s.e&&s.n)s=r.getKey(s);else {if(!s.x5c||!s.x5c.length)return i.Log.error("JoseUtil.validateJwt: RSA key missing key material",s),Promise.reject(new Error("RSA key missing key material"));var d=a(s.x5c[0]);s=n.getPublicKeyFromCertHex(d);}else {if("EC"!==s.kty)return i.Log.error("JoseUtil.validateJwt: Unsupported key type",s&&s.kty),Promise.reject(new Error(s.kty));if(!(s.crv&&s.x&&s.y))return i.Log.error("JoseUtil.validateJwt: EC key missing key material",s),Promise.reject(new Error("EC key missing key material"));s=r.getKey(s);}return t._validateJwt(o,s,u,c,h,l,f)}catch(t){return i.Log.error(t&&t.message||t),Promise.reject("JWT validation failed")}},t.validateJwtAttributes=function e(r,n,o,s,a,u){s||(s=0),a||(a=parseInt(Date.now()/1e3));var c=t.parseJwt(r).payload;if(!c.iss)return i.Log.error("JoseUtil._validateJwt: issuer was not provided"),Promise.reject(new Error("issuer was not provided"));if(c.iss!==n)return i.Log.error("JoseUtil._validateJwt: Invalid issuer in token",c.iss),Promise.reject(new Error("Invalid issuer in token: "+c.iss));if(!c.aud)return i.Log.error("JoseUtil._validateJwt: aud was not provided"),Promise.reject(new Error("aud was not provided"));var h=c.aud===o||Array.isArray(c.aud)&&c.aud.indexOf(o)>=0;if(!h)return i.Log.error("JoseUtil._validateJwt: Invalid audience in token",c.aud),Promise.reject(new Error("Invalid audience in token: "+c.aud));if(c.azp&&c.azp!==o)return i.Log.error("JoseUtil._validateJwt: Invalid azp in token",c.azp),Promise.reject(new Error("Invalid azp in token: "+c.azp));if(!u){var l=a+s,f=a-s;if(!c.iat)return i.Log.error("JoseUtil._validateJwt: iat was not provided"),Promise.reject(new Error("iat was not provided"));if(l<c.iat)return i.Log.error("JoseUtil._validateJwt: iat is in the future",c.iat),Promise.reject(new Error("iat is in the future: "+c.iat));if(c.nbf&&l<c.nbf)return i.Log.error("JoseUtil._validateJwt: nbf is in the future",c.nbf),Promise.reject(new Error("nbf is in the future: "+c.nbf));if(!c.exp)return i.Log.error("JoseUtil._validateJwt: exp was not provided"),Promise.reject(new Error("exp was not provided"));if(c.exp<f)return i.Log.error("JoseUtil._validateJwt: exp is in the past",c.exp),Promise.reject(new Error("exp is in the past:"+c.exp))}return Promise.resolve(c)},t._validateJwt=function r(n,o,s,a,c,h,l){return t.validateJwtAttributes(n,s,a,c,h,l).then(function(t){try{return e.JWS.verify(n,o,u)?t:(i.Log.error("JoseUtil._validateJwt: signature validation failed"),Promise.reject(new Error("signature validation failed")))}catch(t){return i.Log.error(t&&t.message||t),Promise.reject(new Error("signature validation failed"))}})},t.hashString=function t(e,r){try{return o.Util.hashString(e,r)}catch(t){i.Log.error(t);}},t.hexToBase64Url=function t(e){try{return s(e)}catch(t){i.Log.error(t);}},t}()};var i=r(0);t.exports=e.default;},function(t,e,r){var n=r(34),i=r(35);t.exports=function o(t,e,r){var o=e&&r||0;"string"==typeof t&&(e="binary"===t?new Array(16):null,t=null);var s=(t=t||{}).random||(t.rng||n)();if(s[6]=15&s[6]|64,s[8]=63&s[8]|128,e)for(var a=0;a<16;++a)e[o+a]=s[a];return e||i(s)};},function(t,e){var r="undefined"!=typeof crypto&&crypto.getRandomValues&&crypto.getRandomValues.bind(crypto)||"undefined"!=typeof msCrypto&&"function"==typeof window.msCrypto.getRandomValues&&msCrypto.getRandomValues.bind(msCrypto);if(r){var n=new Uint8Array(16);t.exports=function t(){return r(n),n};}else {var i=new Array(16);t.exports=function t(){for(var e,r=0;r<16;r++)0==(3&r)&&(e=4294967296*Math.random()),i[r]=e>>>((3&r)<<3)&255;return i};}},function(t,e){for(var r=[],n=0;n<256;++n)r[n]=(n+256).toString(16).substr(1);t.exports=function i(t,e){var n=e||0,i=r;return [i[t[n++]],i[t[n++]],i[t[n++]],i[t[n++]],"-",i[t[n++]],i[t[n++]],"-",i[t[n++]],i[t[n++]],"-",i[t[n++]],i[t[n++]],"-",i[t[n++]],i[t[n++]],i[t[n++]],i[t[n++]],i[t[n++]],i[t[n++]]].join("")};},function(t,e,r){Object.defineProperty(e,"__esModule",{value:!0}),e.SigninResponse=void 0;var n=function(){function t(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n);}}return function(e,r,n){return r&&t(e.prototype,r),n&&t(e,n),e}}(),i=r(3);e.SigninResponse=function(){function t(e){var r=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"#";!function n(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t);var o=i.UrlUtility.parseUrlFragment(e,r);this.error=o.error,this.error_description=o.error_description,this.error_uri=o.error_uri,this.code=o.code,this.state=o.state,this.id_token=o.id_token,this.session_state=o.session_state,this.access_token=o.access_token,this.token_type=o.token_type,this.scope=o.scope,this.profile=void 0,this.expires_in=o.expires_in;}return n(t,[{key:"expires_in",get:function t(){if(this.expires_at){var e=parseInt(Date.now()/1e3);return this.expires_at-e}},set:function t(e){var r=parseInt(e);if("number"==typeof r&&r>0){var n=parseInt(Date.now()/1e3);this.expires_at=n+r;}}},{key:"expired",get:function t(){var e=this.expires_in;if(void 0!==e)return e<=0}},{key:"scopes",get:function t(){return (this.scope||"").split(" ")}},{key:"isOpenIdConnect",get:function t(){return this.scopes.indexOf("openid")>=0||!!this.id_token}}]),t}();},function(t,e,r){Object.defineProperty(e,"__esModule",{value:!0}),e.SignoutRequest=void 0;var n=r(0),i=r(3),o=r(8);e.SignoutRequest=function t(e){var r=e.url,s=e.id_token_hint,a=e.post_logout_redirect_uri,u=e.data,c=e.extraQueryParams,h=e.request_type;if(function l(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),!r)throw n.Log.error("SignoutRequest.ctor: No url passed"),new Error("url");for(var f in s&&(r=i.UrlUtility.addQueryParam(r,"id_token_hint",s)),a&&(r=i.UrlUtility.addQueryParam(r,"post_logout_redirect_uri",a),u&&(this.state=new o.State({data:u,request_type:h}),r=i.UrlUtility.addQueryParam(r,"state",this.state.id))),c)r=i.UrlUtility.addQueryParam(r,f,c[f]);this.url=r;};},function(t,e,r){Object.defineProperty(e,"__esModule",{value:!0}),e.SignoutResponse=void 0;var n=r(3);e.SignoutResponse=function t(e){!function r(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t);var i=n.UrlUtility.parseUrlFragment(e,"?");this.error=i.error,this.error_description=i.error_description,this.error_uri=i.error_uri,this.state=i.state;};},function(t,e,r){Object.defineProperty(e,"__esModule",{value:!0}),e.InMemoryWebStorage=void 0;var n=function(){function t(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n);}}return function(e,r,n){return r&&t(e.prototype,r),n&&t(e,n),e}}(),i=r(0);e.InMemoryWebStorage=function(){function t(){!function e(t,r){if(!(t instanceof r))throw new TypeError("Cannot call a class as a function")}(this,t),this._data={};}return t.prototype.getItem=function t(e){return i.Log.debug("InMemoryWebStorage.getItem",e),this._data[e]},t.prototype.setItem=function t(e,r){i.Log.debug("InMemoryWebStorage.setItem",e),this._data[e]=r;},t.prototype.removeItem=function t(e){i.Log.debug("InMemoryWebStorage.removeItem",e),delete this._data[e];},t.prototype.key=function t(e){return Object.getOwnPropertyNames(this._data)[e]},n(t,[{key:"length",get:function t(){return Object.getOwnPropertyNames(this._data).length}}]),t}();},function(t,e,r){Object.defineProperty(e,"__esModule",{value:!0}),e.UserManager=void 0;var n=function(){function t(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n);}}return function(e,r,n){return r&&t(e.prototype,r),n&&t(e,n),e}}(),i=r(0),o=r(9),s=r(41),a=r(15),u=r(47),c=r(49),h=r(18),l=r(20),f=r(10),d=r(4);e.UserManager=function(t){function e(){var r=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:c.SilentRenewService,o=arguments.length>2&&void 0!==arguments[2]?arguments[2]:h.SessionMonitor,a=arguments.length>3&&void 0!==arguments[3]?arguments[3]:l.TokenRevocationClient,g=arguments.length>4&&void 0!==arguments[4]?arguments[4]:f.TokenClient,p=arguments.length>5&&void 0!==arguments[5]?arguments[5]:d.JoseUtil;!function v(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,e),r instanceof s.UserManagerSettings||(r=new s.UserManagerSettings(r));var y=function m(t,e){if(!t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return !e||"object"!=typeof e&&"function"!=typeof e?t:e}(this,t.call(this,r));return y._events=new u.UserManagerEvents(r),y._silentRenewService=new n(y),y.settings.automaticSilentRenew&&(i.Log.debug("UserManager.ctor: automaticSilentRenew is configured, setting up silent renew"),y.startSilentRenew()),y.settings.monitorSession&&(i.Log.debug("UserManager.ctor: monitorSession is configured, setting up session monitor"),y._sessionMonitor=new o(y)),y._tokenRevocationClient=new a(y._settings),y._tokenClient=new g(y._settings),y._joseUtil=p,y}return function r(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function, not "+typeof e);t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}}),e&&(Object.setPrototypeOf?Object.setPrototypeOf(t,e):t.__proto__=e);}(e,t),e.prototype.getUser=function t(){var e=this;return this._loadUser().then(function(t){return t?(i.Log.info("UserManager.getUser: user loaded"),e._events.load(t,!1),t):(i.Log.info("UserManager.getUser: user not found in storage"),null)})},e.prototype.removeUser=function t(){var e=this;return this.storeUser(null).then(function(){i.Log.info("UserManager.removeUser: user removed from storage"),e._events.unload();})},e.prototype.signinRedirect=function t(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};(e=Object.assign({},e)).request_type="si:r";var r={useReplaceToNavigate:e.useReplaceToNavigate};return this._signinStart(e,this._redirectNavigator,r).then(function(){i.Log.info("UserManager.signinRedirect: successful");})},e.prototype.signinRedirectCallback=function t(e){return this._signinEnd(e||this._redirectNavigator.url).then(function(t){return t.profile&&t.profile.sub?i.Log.info("UserManager.signinRedirectCallback: successful, signed in sub: ",t.profile.sub):i.Log.info("UserManager.signinRedirectCallback: no sub"),t})},e.prototype.signinPopup=function t(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};(e=Object.assign({},e)).request_type="si:p";var r=e.redirect_uri||this.settings.popup_redirect_uri||this.settings.redirect_uri;return r?(e.redirect_uri=r,e.display="popup",this._signin(e,this._popupNavigator,{startUrl:r,popupWindowFeatures:e.popupWindowFeatures||this.settings.popupWindowFeatures,popupWindowTarget:e.popupWindowTarget||this.settings.popupWindowTarget}).then(function(t){return t&&(t.profile&&t.profile.sub?i.Log.info("UserManager.signinPopup: signinPopup successful, signed in sub: ",t.profile.sub):i.Log.info("UserManager.signinPopup: no sub")),t})):(i.Log.error("UserManager.signinPopup: No popup_redirect_uri or redirect_uri configured"),Promise.reject(new Error("No popup_redirect_uri or redirect_uri configured")))},e.prototype.signinPopupCallback=function t(e){return this._signinCallback(e,this._popupNavigator).then(function(t){return t&&(t.profile&&t.profile.sub?i.Log.info("UserManager.signinPopupCallback: successful, signed in sub: ",t.profile.sub):i.Log.info("UserManager.signinPopupCallback: no sub")),t}).catch(function(t){i.Log.error(t.message);})},e.prototype.signinSilent=function t(){var e=this,r=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};return (r=Object.assign({},r)).request_type="si:s",this._loadUser().then(function(t){return t&&t.refresh_token?(r.refresh_token=t.refresh_token,e._useRefreshToken(r)):(r.id_token_hint=r.id_token_hint||e.settings.includeIdTokenInSilentRenew&&t&&t.id_token,t&&e._settings.validateSubOnSilentRenew&&(i.Log.debug("UserManager.signinSilent, subject prior to silent renew: ",t.profile.sub),r.current_sub=t.profile.sub),e._signinSilentIframe(r))})},e.prototype._useRefreshToken=function t(){var e=this,r=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};return this._tokenClient.exchangeRefreshToken(r).then(function(t){return t?t.access_token?e._loadUser().then(function(r){if(r){var n=Promise.resolve();return t.id_token&&(n=e._validateIdTokenFromTokenRefreshToken(r.profile,t.id_token)),n.then(function(){return i.Log.debug("UserManager._useRefreshToken: refresh token response success"),r.id_token=t.id_token,r.access_token=t.access_token,r.refresh_token=t.refresh_token||r.refresh_token,r.expires_in=t.expires_in,e.storeUser(r).then(function(){return e._events.load(r),r})})}return null}):(i.Log.error("UserManager._useRefreshToken: No access token returned from token endpoint"),Promise.reject("No access token returned from token endpoint")):(i.Log.error("UserManager._useRefreshToken: No response returned from token endpoint"),Promise.reject("No response returned from token endpoint"))})},e.prototype._validateIdTokenFromTokenRefreshToken=function t(e,r){var n=this;return this._metadataService.getIssuer().then(function(t){return n._joseUtil.validateJwtAttributes(r,t,n._settings.client_id,n._settings.clockSkew).then(function(t){return t?t.sub!==e.sub?(i.Log.error("UserManager._validateIdTokenFromTokenRefreshToken: sub in id_token does not match current sub"),Promise.reject(new Error("sub in id_token does not match current sub"))):t.auth_time&&t.auth_time!==e.auth_time?(i.Log.error("UserManager._validateIdTokenFromTokenRefreshToken: auth_time in id_token does not match original auth_time"),Promise.reject(new Error("auth_time in id_token does not match original auth_time"))):t.azp&&t.azp!==e.azp?(i.Log.error("UserManager._validateIdTokenFromTokenRefreshToken: azp in id_token does not match original azp"),Promise.reject(new Error("azp in id_token does not match original azp"))):!t.azp&&e.azp?(i.Log.error("UserManager._validateIdTokenFromTokenRefreshToken: azp not in id_token, but present in original id_token"),Promise.reject(new Error("azp not in id_token, but present in original id_token"))):void 0:(i.Log.error("UserManager._validateIdTokenFromTokenRefreshToken: Failed to validate id_token"),Promise.reject(new Error("Failed to validate id_token")))})})},e.prototype._signinSilentIframe=function t(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},r=e.redirect_uri||this.settings.silent_redirect_uri||this.settings.redirect_uri;return r?(e.redirect_uri=r,e.prompt=e.prompt||"none",this._signin(e,this._iframeNavigator,{startUrl:r,silentRequestTimeout:e.silentRequestTimeout||this.settings.silentRequestTimeout}).then(function(t){return t&&(t.profile&&t.profile.sub?i.Log.info("UserManager.signinSilent: successful, signed in sub: ",t.profile.sub):i.Log.info("UserManager.signinSilent: no sub")),t})):(i.Log.error("UserManager.signinSilent: No silent_redirect_uri configured"),Promise.reject(new Error("No silent_redirect_uri configured")))},e.prototype.signinSilentCallback=function t(e){return this._signinCallback(e,this._iframeNavigator).then(function(t){return t&&(t.profile&&t.profile.sub?i.Log.info("UserManager.signinSilentCallback: successful, signed in sub: ",t.profile.sub):i.Log.info("UserManager.signinSilentCallback: no sub")),t})},e.prototype.signinCallback=function t(e){var r=this;return this.readSigninResponseState(e).then(function(t){var n=t.state;t.response;return "si:r"===n.request_type?r.signinRedirectCallback(e):"si:p"===n.request_type?r.signinPopupCallback(e):"si:s"===n.request_type?r.signinSilentCallback(e):Promise.reject(new Error("invalid response_type in state"))})},e.prototype.signoutCallback=function t(e,r){var n=this;return this.readSignoutResponseState(e).then(function(t){var i=t.state,o=t.response;return i?"so:r"===i.request_type?n.signoutRedirectCallback(e):"so:p"===i.request_type?n.signoutPopupCallback(e,r):Promise.reject(new Error("invalid response_type in state")):o})},e.prototype.querySessionStatus=function t(){var e=this,r=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};(r=Object.assign({},r)).request_type="si:s";var n=r.redirect_uri||this.settings.silent_redirect_uri||this.settings.redirect_uri;return n?(r.redirect_uri=n,r.prompt="none",r.response_type=r.response_type||this.settings.query_status_response_type,r.scope=r.scope||"openid",r.skipUserInfo=!0,this._signinStart(r,this._iframeNavigator,{startUrl:n,silentRequestTimeout:r.silentRequestTimeout||this.settings.silentRequestTimeout}).then(function(t){return e.processSigninResponse(t.url).then(function(t){if(i.Log.debug("UserManager.querySessionStatus: got signin response"),t.session_state&&t.profile.sub)return i.Log.info("UserManager.querySessionStatus: querySessionStatus success for sub: ",t.profile.sub),{session_state:t.session_state,sub:t.profile.sub,sid:t.profile.sid};i.Log.info("querySessionStatus successful, user not authenticated");}).catch(function(t){if(t.session_state&&e.settings.monitorAnonymousSession&&("login_required"==t.message||"consent_required"==t.message||"interaction_required"==t.message||"account_selection_required"==t.message))return i.Log.info("UserManager.querySessionStatus: querySessionStatus success for anonymous user"),{session_state:t.session_state};throw t})})):(i.Log.error("UserManager.querySessionStatus: No silent_redirect_uri configured"),Promise.reject(new Error("No silent_redirect_uri configured")))},e.prototype._signin=function t(e,r){var n=this,i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{};return this._signinStart(e,r,i).then(function(t){return n._signinEnd(t.url,e)})},e.prototype._signinStart=function t(e,r){var n=this,o=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{};return r.prepare(o).then(function(t){return i.Log.debug("UserManager._signinStart: got navigator window handle"),n.createSigninRequest(e).then(function(e){return i.Log.debug("UserManager._signinStart: got signin request"),o.url=e.url,o.id=e.state.id,t.navigate(o)}).catch(function(e){throw t.close&&(i.Log.debug("UserManager._signinStart: Error after preparing navigator, closing navigator window"),t.close()),e})})},e.prototype._signinEnd=function t(e){var r=this,n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};return this.processSigninResponse(e).then(function(t){i.Log.debug("UserManager._signinEnd: got signin response");var e=new a.User(t);if(n.current_sub){if(n.current_sub!==e.profile.sub)return i.Log.debug("UserManager._signinEnd: current user does not match user returned from signin. sub from signin: ",e.profile.sub),Promise.reject(new Error("login_required"));i.Log.debug("UserManager._signinEnd: current user matches user returned from signin");}return r.storeUser(e).then(function(){return i.Log.debug("UserManager._signinEnd: user stored"),r._events.load(e),e})})},e.prototype._signinCallback=function t(e,r){return i.Log.debug("UserManager._signinCallback"),r.callback(e)},e.prototype.signoutRedirect=function t(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};(e=Object.assign({},e)).request_type="so:r";var r=e.post_logout_redirect_uri||this.settings.post_logout_redirect_uri;r&&(e.post_logout_redirect_uri=r);var n={useReplaceToNavigate:e.useReplaceToNavigate};return this._signoutStart(e,this._redirectNavigator,n).then(function(){i.Log.info("UserManager.signoutRedirect: successful");})},e.prototype.signoutRedirectCallback=function t(e){return this._signoutEnd(e||this._redirectNavigator.url).then(function(t){return i.Log.info("UserManager.signoutRedirectCallback: successful"),t})},e.prototype.signoutPopup=function t(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};(e=Object.assign({},e)).request_type="so:p";var r=e.post_logout_redirect_uri||this.settings.popup_post_logout_redirect_uri||this.settings.post_logout_redirect_uri;return e.post_logout_redirect_uri=r,e.display="popup",e.post_logout_redirect_uri&&(e.state=e.state||{}),this._signout(e,this._popupNavigator,{startUrl:r,popupWindowFeatures:e.popupWindowFeatures||this.settings.popupWindowFeatures,popupWindowTarget:e.popupWindowTarget||this.settings.popupWindowTarget}).then(function(){i.Log.info("UserManager.signoutPopup: successful");})},e.prototype.signoutPopupCallback=function t(e,r){void 0===r&&"boolean"==typeof e&&(r=e,e=null);return this._popupNavigator.callback(e,r,"?").then(function(){i.Log.info("UserManager.signoutPopupCallback: successful");})},e.prototype._signout=function t(e,r){var n=this,i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{};return this._signoutStart(e,r,i).then(function(t){return n._signoutEnd(t.url)})},e.prototype._signoutStart=function t(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},r=this,n=arguments[1],o=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{};return n.prepare(o).then(function(t){return i.Log.debug("UserManager._signoutStart: got navigator window handle"),r._loadUser().then(function(n){return i.Log.debug("UserManager._signoutStart: loaded current user from storage"),(r._settings.revokeAccessTokenOnSignout?r._revokeInternal(n):Promise.resolve()).then(function(){var s=e.id_token_hint||n&&n.id_token;return s&&(i.Log.debug("UserManager._signoutStart: Setting id_token into signout request"),e.id_token_hint=s),r.removeUser().then(function(){return i.Log.debug("UserManager._signoutStart: user removed, creating signout request"),r.createSignoutRequest(e).then(function(e){return i.Log.debug("UserManager._signoutStart: got signout request"),o.url=e.url,e.state&&(o.id=e.state.id),t.navigate(o)})})})}).catch(function(e){throw t.close&&(i.Log.debug("UserManager._signoutStart: Error after preparing navigator, closing navigator window"),t.close()),e})})},e.prototype._signoutEnd=function t(e){return this.processSignoutResponse(e).then(function(t){return i.Log.debug("UserManager._signoutEnd: got signout response"),t})},e.prototype.revokeAccessToken=function t(){var e=this;return this._loadUser().then(function(t){return e._revokeInternal(t,!0).then(function(r){if(r)return i.Log.debug("UserManager.revokeAccessToken: removing token properties from user and re-storing"),t.access_token=null,t.refresh_token=null,t.expires_at=null,t.token_type=null,e.storeUser(t).then(function(){i.Log.debug("UserManager.revokeAccessToken: user stored"),e._events.load(t);})})}).then(function(){i.Log.info("UserManager.revokeAccessToken: access token revoked successfully");})},e.prototype._revokeInternal=function t(e,r){var n=this;if(e){var o=e.access_token,s=e.refresh_token;return this._revokeAccessTokenInternal(o,r).then(function(t){return n._revokeRefreshTokenInternal(s,r).then(function(e){return t||e||i.Log.debug("UserManager.revokeAccessToken: no need to revoke due to no token(s), or JWT format"),t||e})})}return Promise.resolve(!1)},e.prototype._revokeAccessTokenInternal=function t(e,r){return !e||e.indexOf(".")>=0?Promise.resolve(!1):this._tokenRevocationClient.revoke(e,r).then(function(){return !0})},e.prototype._revokeRefreshTokenInternal=function t(e,r){return e?this._tokenRevocationClient.revoke(e,r,"refresh_token").then(function(){return !0}):Promise.resolve(!1)},e.prototype.startSilentRenew=function t(){this._silentRenewService.start();},e.prototype.stopSilentRenew=function t(){this._silentRenewService.stop();},e.prototype._loadUser=function t(){return this._userStore.get(this._userStoreKey).then(function(t){return t?(i.Log.debug("UserManager._loadUser: user storageString loaded"),a.User.fromStorageString(t)):(i.Log.debug("UserManager._loadUser: no user storageString"),null)})},e.prototype.storeUser=function t(e){if(e){i.Log.debug("UserManager.storeUser: storing user");var r=e.toStorageString();return this._userStore.set(this._userStoreKey,r)}return i.Log.debug("storeUser.storeUser: removing user"),this._userStore.remove(this._userStoreKey)},n(e,[{key:"_redirectNavigator",get:function t(){return this.settings.redirectNavigator}},{key:"_popupNavigator",get:function t(){return this.settings.popupNavigator}},{key:"_iframeNavigator",get:function t(){return this.settings.iframeNavigator}},{key:"_userStore",get:function t(){return this.settings.userStore}},{key:"events",get:function t(){return this._events}},{key:"_userStoreKey",get:function t(){return "user:"+this.settings.authority+":"+this.settings.client_id}}]),e}(o.OidcClient);},function(t,e,r){Object.defineProperty(e,"__esModule",{value:!0}),e.UserManagerSettings=void 0;var n=function(){function t(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n);}}return function(e,r,n){return r&&t(e.prototype,r),n&&t(e,n),e}}(),i=(r(0),r(5)),o=r(42),s=r(43),a=r(45),u=r(6),c=r(1),h=r(12);var l=60,f=2e3;e.UserManagerSettings=function(t){function e(){var r=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},n=r.popup_redirect_uri,i=r.popup_post_logout_redirect_uri,d=r.popupWindowFeatures,g=r.popupWindowTarget,p=r.silent_redirect_uri,v=r.silentRequestTimeout,y=r.automaticSilentRenew,m=void 0!==y&&y,_=r.validateSubOnSilentRenew,S=void 0!==_&&_,F=r.includeIdTokenInSilentRenew,b=void 0===F||F,w=r.monitorSession,E=void 0===w||w,x=r.monitorAnonymousSession,k=void 0!==x&&x,A=r.checkSessionInterval,P=void 0===A?f:A,C=r.stopCheckSessionOnError,T=void 0===C||C,R=r.query_status_response_type,I=r.revokeAccessTokenOnSignout,D=void 0!==I&&I,U=r.accessTokenExpiringNotificationTime,L=void 0===U?l:U,B=r.redirectNavigator,N=void 0===B?new o.RedirectNavigator:B,O=r.popupNavigator,j=void 0===O?new s.PopupNavigator:O,H=r.iframeNavigator,M=void 0===H?new a.IFrameNavigator:H,K=r.userStore,V=void 0===K?new u.WebStorageStateStore({store:c.Global.sessionStorage}):K;!function q(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,e);var J=function W(t,e){if(!t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return !e||"object"!=typeof e&&"function"!=typeof e?t:e}(this,t.call(this,arguments[0]));return J._popup_redirect_uri=n,J._popup_post_logout_redirect_uri=i,J._popupWindowFeatures=d,J._popupWindowTarget=g,J._silent_redirect_uri=p,J._silentRequestTimeout=v,J._automaticSilentRenew=m,J._validateSubOnSilentRenew=S,J._includeIdTokenInSilentRenew=b,J._accessTokenExpiringNotificationTime=L,J._monitorSession=E,J._monitorAnonymousSession=k,J._checkSessionInterval=P,J._stopCheckSessionOnError=T,R?J._query_status_response_type=R:arguments[0]&&arguments[0].response_type?J._query_status_response_type=h.SigninRequest.isOidc(arguments[0].response_type)?"id_token":"code":J._query_status_response_type="id_token",J._revokeAccessTokenOnSignout=D,J._redirectNavigator=N,J._popupNavigator=j,J._iframeNavigator=M,J._userStore=V,J}return function r(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function, not "+typeof e);t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}}),e&&(Object.setPrototypeOf?Object.setPrototypeOf(t,e):t.__proto__=e);}(e,t),n(e,[{key:"popup_redirect_uri",get:function t(){return this._popup_redirect_uri}},{key:"popup_post_logout_redirect_uri",get:function t(){return this._popup_post_logout_redirect_uri}},{key:"popupWindowFeatures",get:function t(){return this._popupWindowFeatures}},{key:"popupWindowTarget",get:function t(){return this._popupWindowTarget}},{key:"silent_redirect_uri",get:function t(){return this._silent_redirect_uri}},{key:"silentRequestTimeout",get:function t(){return this._silentRequestTimeout}},{key:"automaticSilentRenew",get:function t(){return this._automaticSilentRenew}},{key:"validateSubOnSilentRenew",get:function t(){return this._validateSubOnSilentRenew}},{key:"includeIdTokenInSilentRenew",get:function t(){return this._includeIdTokenInSilentRenew}},{key:"accessTokenExpiringNotificationTime",get:function t(){return this._accessTokenExpiringNotificationTime}},{key:"monitorSession",get:function t(){return this._monitorSession}},{key:"monitorAnonymousSession",get:function t(){return this._monitorAnonymousSession}},{key:"checkSessionInterval",get:function t(){return this._checkSessionInterval}},{key:"stopCheckSessionOnError",get:function t(){return this._stopCheckSessionOnError}},{key:"query_status_response_type",get:function t(){return this._query_status_response_type}},{key:"revokeAccessTokenOnSignout",get:function t(){return this._revokeAccessTokenOnSignout}},{key:"redirectNavigator",get:function t(){return this._redirectNavigator}},{key:"popupNavigator",get:function t(){return this._popupNavigator}},{key:"iframeNavigator",get:function t(){return this._iframeNavigator}},{key:"userStore",get:function t(){return this._userStore}}]),e}(i.OidcClientSettings);},function(t,e,r){Object.defineProperty(e,"__esModule",{value:!0}),e.RedirectNavigator=void 0;var n=function(){function t(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n);}}return function(e,r,n){return r&&t(e.prototype,r),n&&t(e,n),e}}(),i=r(0);e.RedirectNavigator=function(){function t(){!function e(t,r){if(!(t instanceof r))throw new TypeError("Cannot call a class as a function")}(this,t);}return t.prototype.prepare=function t(){return Promise.resolve(this)},t.prototype.navigate=function t(e){return e&&e.url?(e.useReplaceToNavigate?window.location.replace(e.url):window.location=e.url,Promise.resolve()):(i.Log.error("RedirectNavigator.navigate: No url provided"),Promise.reject(new Error("No url provided")))},n(t,[{key:"url",get:function t(){return window.location.href}}]),t}();},function(t,e,r){Object.defineProperty(e,"__esModule",{value:!0}),e.PopupNavigator=void 0;var n=r(0),i=r(44);e.PopupNavigator=function(){function t(){!function e(t,r){if(!(t instanceof r))throw new TypeError("Cannot call a class as a function")}(this,t);}return t.prototype.prepare=function t(e){var r=new i.PopupWindow(e);return Promise.resolve(r)},t.prototype.callback=function t(e,r,o){n.Log.debug("PopupNavigator.callback");try{return i.PopupWindow.notifyOpener(e,r,o),Promise.resolve()}catch(t){return Promise.reject(t)}},t}();},function(t,e,r){Object.defineProperty(e,"__esModule",{value:!0}),e.PopupWindow=void 0;var n=function(){function t(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n);}}return function(e,r,n){return r&&t(e.prototype,r),n&&t(e,n),e}}(),i=r(0),o=r(3);var s=500,a="location=no,toolbar=no,width=500,height=500,left=100,top=100;",u="_blank";e.PopupWindow=function(){function t(e){var r=this;!function n(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),this._promise=new Promise(function(t,e){r._resolve=t,r._reject=e;});var o=e.popupWindowTarget||u,c=e.popupWindowFeatures||a;this._popup=window.open("",o,c),this._popup&&(i.Log.debug("PopupWindow.ctor: popup successfully created"),this._checkForPopupClosedTimer=window.setInterval(this._checkForPopupClosed.bind(this),s));}return t.prototype.navigate=function t(e){return this._popup?e&&e.url?(i.Log.debug("PopupWindow.navigate: Setting URL in popup"),this._id=e.id,this._id&&(window["popupCallback_"+e.id]=this._callback.bind(this)),this._popup.focus(),this._popup.window.location=e.url):(this._error("PopupWindow.navigate: no url provided"),this._error("No url provided")):this._error("PopupWindow.navigate: Error opening popup window"),this.promise},t.prototype._success=function t(e){i.Log.debug("PopupWindow.callback: Successful response from popup window"),this._cleanup(),this._resolve(e);},t.prototype._error=function t(e){i.Log.error("PopupWindow.error: ",e),this._cleanup(),this._reject(new Error(e));},t.prototype.close=function t(){this._cleanup(!1);},t.prototype._cleanup=function t(e){i.Log.debug("PopupWindow.cleanup"),window.clearInterval(this._checkForPopupClosedTimer),this._checkForPopupClosedTimer=null,delete window["popupCallback_"+this._id],this._popup&&!e&&this._popup.close(),this._popup=null;},t.prototype._checkForPopupClosed=function t(){this._popup&&!this._popup.closed||this._error("Popup window closed");},t.prototype._callback=function t(e,r){this._cleanup(r),e?(i.Log.debug("PopupWindow.callback success"),this._success({url:e})):(i.Log.debug("PopupWindow.callback: Invalid response from popup"),this._error("Invalid response from popup"));},t.notifyOpener=function t(e,r,n){if(window.opener){if(e=e||window.location.href){var s=o.UrlUtility.parseUrlFragment(e,n);if(s.state){var a="popupCallback_"+s.state,u=window.opener[a];u?(i.Log.debug("PopupWindow.notifyOpener: passing url message to opener"),u(e,r)):i.Log.warn("PopupWindow.notifyOpener: no matching callback found on opener");}else i.Log.warn("PopupWindow.notifyOpener: no state found in response url");}}else i.Log.warn("PopupWindow.notifyOpener: no window.opener. Can't complete notification.");},n(t,[{key:"promise",get:function t(){return this._promise}}]),t}();},function(t,e,r){Object.defineProperty(e,"__esModule",{value:!0}),e.IFrameNavigator=void 0;var n=r(0),i=r(46);e.IFrameNavigator=function(){function t(){!function e(t,r){if(!(t instanceof r))throw new TypeError("Cannot call a class as a function")}(this,t);}return t.prototype.prepare=function t(e){var r=new i.IFrameWindow(e);return Promise.resolve(r)},t.prototype.callback=function t(e){n.Log.debug("IFrameNavigator.callback");try{return i.IFrameWindow.notifyParent(e),Promise.resolve()}catch(t){return Promise.reject(t)}},t}();},function(t,e,r){Object.defineProperty(e,"__esModule",{value:!0}),e.IFrameWindow=void 0;var n=function(){function t(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n);}}return function(e,r,n){return r&&t(e.prototype,r),n&&t(e,n),e}}(),i=r(0);e.IFrameWindow=function(){function t(e){var r=this;!function n(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),this._promise=new Promise(function(t,e){r._resolve=t,r._reject=e;}),this._boundMessageEvent=this._message.bind(this),window.addEventListener("message",this._boundMessageEvent,!1),this._frame=window.document.createElement("iframe"),this._frame.style.visibility="hidden",this._frame.style.position="absolute",this._frame.style.display="none",this._frame.style.width=0,this._frame.style.height=0,window.document.body.appendChild(this._frame);}return t.prototype.navigate=function t(e){if(e&&e.url){var r=e.silentRequestTimeout||1e4;i.Log.debug("IFrameWindow.navigate: Using timeout of:",r),this._timer=window.setTimeout(this._timeout.bind(this),r),this._frame.src=e.url;}else this._error("No url provided");return this.promise},t.prototype._success=function t(e){this._cleanup(),i.Log.debug("IFrameWindow: Successful response from frame window"),this._resolve(e);},t.prototype._error=function t(e){this._cleanup(),i.Log.error(e),this._reject(new Error(e));},t.prototype.close=function t(){this._cleanup();},t.prototype._cleanup=function t(){this._frame&&(i.Log.debug("IFrameWindow: cleanup"),window.removeEventListener("message",this._boundMessageEvent,!1),window.clearTimeout(this._timer),window.document.body.removeChild(this._frame),this._timer=null,this._frame=null,this._boundMessageEvent=null);},t.prototype._timeout=function t(){i.Log.debug("IFrameWindow.timeout"),this._error("Frame window timed out");},t.prototype._message=function t(e){if(i.Log.debug("IFrameWindow.message"),this._timer&&e.origin===this._origin&&e.source===this._frame.contentWindow){var r=e.data;r?this._success({url:r}):this._error("Invalid response from frame");}},t.notifyParent=function t(e){i.Log.debug("IFrameWindow.notifyParent"),window.frameElement&&(e=e||window.location.href)&&(i.Log.debug("IFrameWindow.notifyParent: posting url message to parent"),window.parent.postMessage(e,location.protocol+"//"+location.host));},n(t,[{key:"promise",get:function t(){return this._promise}},{key:"_origin",get:function t(){return location.protocol+"//"+location.host}}]),t}();},function(t,e,r){Object.defineProperty(e,"__esModule",{value:!0}),e.UserManagerEvents=void 0;var n=r(0),i=r(16),o=r(17);e.UserManagerEvents=function(t){function e(r){!function n(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,e);var i=function s(t,e){if(!t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return !e||"object"!=typeof e&&"function"!=typeof e?t:e}(this,t.call(this,r));return i._userLoaded=new o.Event("User loaded"),i._userUnloaded=new o.Event("User unloaded"),i._silentRenewError=new o.Event("Silent renew error"),i._userSignedIn=new o.Event("User signed in"),i._userSignedOut=new o.Event("User signed out"),i._userSessionChanged=new o.Event("User session changed"),i}return function r(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function, not "+typeof e);t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}}),e&&(Object.setPrototypeOf?Object.setPrototypeOf(t,e):t.__proto__=e);}(e,t),e.prototype.load=function e(r){var i=!(arguments.length>1&&void 0!==arguments[1])||arguments[1];n.Log.debug("UserManagerEvents.load"),t.prototype.load.call(this,r),i&&this._userLoaded.raise(r);},e.prototype.unload=function e(){n.Log.debug("UserManagerEvents.unload"),t.prototype.unload.call(this),this._userUnloaded.raise();},e.prototype.addUserLoaded=function t(e){this._userLoaded.addHandler(e);},e.prototype.removeUserLoaded=function t(e){this._userLoaded.removeHandler(e);},e.prototype.addUserUnloaded=function t(e){this._userUnloaded.addHandler(e);},e.prototype.removeUserUnloaded=function t(e){this._userUnloaded.removeHandler(e);},e.prototype.addSilentRenewError=function t(e){this._silentRenewError.addHandler(e);},e.prototype.removeSilentRenewError=function t(e){this._silentRenewError.removeHandler(e);},e.prototype._raiseSilentRenewError=function t(e){n.Log.debug("UserManagerEvents._raiseSilentRenewError",e.message),this._silentRenewError.raise(e);},e.prototype.addUserSignedIn=function t(e){this._userSignedIn.addHandler(e);},e.prototype.removeUserSignedIn=function t(e){this._userSignedIn.removeHandler(e);},e.prototype._raiseUserSignedIn=function t(){n.Log.debug("UserManagerEvents._raiseUserSignedIn"),this._userSignedIn.raise();},e.prototype.addUserSignedOut=function t(e){this._userSignedOut.addHandler(e);},e.prototype.removeUserSignedOut=function t(e){this._userSignedOut.removeHandler(e);},e.prototype._raiseUserSignedOut=function t(){n.Log.debug("UserManagerEvents._raiseUserSignedOut"),this._userSignedOut.raise();},e.prototype.addUserSessionChanged=function t(e){this._userSessionChanged.addHandler(e);},e.prototype.removeUserSessionChanged=function t(e){this._userSessionChanged.removeHandler(e);},e.prototype._raiseUserSessionChanged=function t(){n.Log.debug("UserManagerEvents._raiseUserSessionChanged"),this._userSessionChanged.raise();},e}(i.AccessTokenEvents);},function(t,e,r){Object.defineProperty(e,"__esModule",{value:!0}),e.Timer=void 0;var n=function(){function t(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n);}}return function(e,r,n){return r&&t(e.prototype,r),n&&t(e,n),e}}(),i=r(0),o=r(1),s=r(17);e.Timer=function(t){function e(r){var n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:o.Global.timer,i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:void 0;!function s(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,e);var a=function u(t,e){if(!t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return !e||"object"!=typeof e&&"function"!=typeof e?t:e}(this,t.call(this,r));return a._timer=n,a._nowFunc=i||function(){return Date.now()/1e3},a}return function r(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function, not "+typeof e);t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}}),e&&(Object.setPrototypeOf?Object.setPrototypeOf(t,e):t.__proto__=e);}(e,t),e.prototype.init=function t(e){e<=0&&(e=1),e=parseInt(e);var r=this.now+e;if(this.expiration===r&&this._timerHandle)i.Log.debug("Timer.init timer "+this._name+" skipping initialization since already initialized for expiration:",this.expiration);else {this.cancel(),i.Log.debug("Timer.init timer "+this._name+" for duration:",e),this._expiration=r;var n=5;e<n&&(n=e),this._timerHandle=this._timer.setInterval(this._callback.bind(this),1e3*n);}},e.prototype.cancel=function t(){this._timerHandle&&(i.Log.debug("Timer.cancel: ",this._name),this._timer.clearInterval(this._timerHandle),this._timerHandle=null);},e.prototype._callback=function e(){var r=this._expiration-this.now;i.Log.debug("Timer.callback; "+this._name+" timer expires in:",r),this._expiration<=this.now&&(this.cancel(),t.prototype.raise.call(this));},n(e,[{key:"now",get:function t(){return parseInt(this._nowFunc())}},{key:"expiration",get:function t(){return this._expiration}}]),e}(s.Event);},function(t,e,r){Object.defineProperty(e,"__esModule",{value:!0}),e.SilentRenewService=void 0;var n=r(0);e.SilentRenewService=function(){function t(e){!function r(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),this._userManager=e;}return t.prototype.start=function t(){this._callback||(this._callback=this._tokenExpiring.bind(this),this._userManager.events.addAccessTokenExpiring(this._callback),this._userManager.getUser().then(function(t){}).catch(function(t){n.Log.error("SilentRenewService.start: Error from getUser:",t.message);}));},t.prototype.stop=function t(){this._callback&&(this._userManager.events.removeAccessTokenExpiring(this._callback),delete this._callback);},t.prototype._tokenExpiring=function t(){var e=this;this._userManager.signinSilent().then(function(t){n.Log.debug("SilentRenewService._tokenExpiring: Silent token renewal successful");},function(t){n.Log.error("SilentRenewService._tokenExpiring: Error from signinSilent:",t.message),e._userManager.events._raiseSilentRenewError(t);});},t}();},function(t,e,r){Object.defineProperty(e,"__esModule",{value:!0}),e.CordovaPopupNavigator=void 0;var n=r(21);e.CordovaPopupNavigator=function(){function t(){!function e(t,r){if(!(t instanceof r))throw new TypeError("Cannot call a class as a function")}(this,t);}return t.prototype.prepare=function t(e){var r=new n.CordovaPopupWindow(e);return Promise.resolve(r)},t}();},function(t,e,r){Object.defineProperty(e,"__esModule",{value:!0}),e.CordovaIFrameNavigator=void 0;var n=r(21);e.CordovaIFrameNavigator=function(){function t(){!function e(t,r){if(!(t instanceof r))throw new TypeError("Cannot call a class as a function")}(this,t);}return t.prototype.prepare=function t(e){e.popupWindowFeatures="hidden=yes";var r=new n.CordovaPopupWindow(e);return Promise.resolve(r)},t}();},function(t,e,r){Object.defineProperty(e,"__esModule",{value:!0});e.Version="1.10.1";}])});
    });

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    /* src/c8s/OidcContext.svelte generated by Svelte v3.29.7 */

    const { Error: Error_1 } = globals;

    function create_fragment$3(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[7].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[6], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 64) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[6], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const { UserManager } = oidcClient_min;
    const isLoading = writable(true);
    const isAuthenticated = writable(false);
    const accessToken = writable("");
    const idToken = writable("");
    const userInfo = writable({});
    const authError = writable(null);
    const isReady = writable(false);
    const OIDC_CONTEXT_CLIENT_PROMISE = writable({});
    const OIDC_CONTEXT_REDIRECT_URI = writable({});
    const OIDC_CONTEXT_POST_LOGOUT_REDIRECT_URI = writable({});

    async function refreshToken() {
    	isReady.set(false);

    	try {
    		//const oidc = await getContext(OIDC_CONTEXT_CLIENT_PROMISE);
    		const oidc = await get_store_value(OIDC_CONTEXT_CLIENT_PROMISE);

    		await oidc.signinSilent();
    		isReady.set(true);
    		return true;
    	} catch(e) {
    		// set error state for reactive handling
    		authError.set(e.message);

    		isReady.set(true);
    		return false;
    	}
    }

    async function login(preserveRoute = true, callback_url = null) {
    	const oidc = await get_store_value(OIDC_CONTEXT_CLIENT_PROMISE);
    	const redirect_uri = callback_url || get_store_value(OIDC_CONTEXT_REDIRECT_URI) || window.location.href;

    	// try to keep the user on the same page from which they triggered login. If set to false should typically
    	// cause redirect to /.
    	const appState = preserveRoute
    	? {
    			pathname: window.location.pathname,
    			search: window.location.search
    		}
    	: {};

    	await oidc.signinRedirect({ redirect_uri, appState });
    }

    async function logout(logout_url = null) {
    	const oidc = await get_store_value(OIDC_CONTEXT_CLIENT_PROMISE);
    	const returnTo = logout_url || get_store_value(OIDC_CONTEXT_POST_LOGOUT_REDIRECT_URI) || window.location.href;
    	await oidc.signoutRedirect({ returnTo });
    }

    async function handleOnDestroy() {
    	
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $isAuthenticated,
    		$$unsubscribe_isAuthenticated = noop;

    	validate_store(isAuthenticated, "isAuthenticated");
    	component_subscribe($$self, isAuthenticated, $$value => $$invalidate(8, $isAuthenticated = $$value));
    	$$self.$$.on_destroy.push(() => $$unsubscribe_isAuthenticated());
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("OidcContext", slots, ['default']);
    	let { issuer } = $$props;
    	let { client_id } = $$props;
    	let { redirect_uri } = $$props;
    	let { post_logout_redirect_uri } = $$props;
    	let { metadata = null } = $$props;
    	let { scope = "openid profile email" } = $$props;
    	OIDC_CONTEXT_REDIRECT_URI.set(redirect_uri);
    	OIDC_CONTEXT_POST_LOGOUT_REDIRECT_URI.set(post_logout_redirect_uri);

    	const settings = {
    		authority: issuer,
    		client_id,
    		redirect_uri,
    		post_logout_redirect_uri,
    		response_type: "code",
    		scope,
    		automaticSilentRenew: true,
    		metadata
    	};

    	const userManager = new UserManager(settings);

    	userManager.events.addUserLoaded(function (user) {
    		isAuthenticated.set(true);
    		accessToken.set(user.access_token);
    		idToken.set(user.id_token);
    		userInfo.set(user.profile);
    		isReady.set(true);
    	});

    	userManager.events.addUserUnloaded(function () {
    		isAuthenticated.set(false);
    		idToken.set("");
    		accessToken.set("");
    		userInfo.set({});
    		isReady.set(true);
    	});

    	userManager.events.addSilentRenewError(function (e) {
    		authError.set(`SilentRenewError: ${e.message}`);
    	});

    	// userManager needs to be wrapped in a promise and the work
    	// needs to be done onMount to otherwise there is an
    	// Error: Function called outside component initialization
    	let oidcPromise = Promise.resolve(userManager);

    	OIDC_CONTEXT_CLIENT_PROMISE.set(oidcPromise);

    	// Not all browsers support this, please program defensively!
    	const params = new URLSearchParams(window.location.search);

    	// Use 'error' and 'code' to test if the component is being executed as a part of a login callback. If we're not
    	// running in a login callback, and the user isn't logged in, see if we can capture their existing session.
    	if (!params.has("error") && !params.has("code") && !$isAuthenticated) {
    		refreshToken();
    	}

    	async function handleOnMount() {
    		// on run onMount after oidc
    		const oidc = await oidcPromise;

    		// Check if something went wrong during login redirect
    		// and extract the error message
    		if (params.has("error")) {
    			authError.set(new Error(params.get("error_description")));
    		}

    		// if code then login success
    		if (params.has("code")) {
    			// handle the callback
    			const response = await oidc.signinCallback();

    			let state = response && response.state || {};

    			// Can be smart here and redirect to original path instead of root
    			const url = state && state.targetUrl
    			? state.targetUrl
    			: window.location.pathname;

    			state = { ...state, isRedirectCallback: true };

    			// redirect to the last page we were on when login was configured if it was passed.
    			history.replaceState(state, "", url);

    			// location.href = url;
    			// clear errors on login.
    			authError.set(null);
    		} else // if code was not set and there was a state, then we're in an auth callback and there was an error. We still
    		// need to wrap the sign-in silent. We need to sit down and chart out the various success and fail scenarios and
    		// what the uris loook like. I fear this may be problematic in other auth flows in the future.
    		if (params.has("state")) {
    			const response = await oidc.signinCallback();
    		}

    		isLoading.set(false);
    	}

    	onMount(handleOnMount);
    	onDestroy(handleOnDestroy);

    	const writable_props = [
    		"issuer",
    		"client_id",
    		"redirect_uri",
    		"post_logout_redirect_uri",
    		"metadata",
    		"scope"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<OidcContext> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("issuer" in $$props) $$invalidate(0, issuer = $$props.issuer);
    		if ("client_id" in $$props) $$invalidate(1, client_id = $$props.client_id);
    		if ("redirect_uri" in $$props) $$invalidate(2, redirect_uri = $$props.redirect_uri);
    		if ("post_logout_redirect_uri" in $$props) $$invalidate(3, post_logout_redirect_uri = $$props.post_logout_redirect_uri);
    		if ("metadata" in $$props) $$invalidate(4, metadata = $$props.metadata);
    		if ("scope" in $$props) $$invalidate(5, scope = $$props.scope);
    		if ("$$scope" in $$props) $$invalidate(6, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		writable,
    		get: get_store_value,
    		oidcClient: oidcClient_min,
    		UserManager,
    		onMount,
    		onDestroy,
    		isLoading,
    		isAuthenticated,
    		accessToken,
    		idToken,
    		userInfo,
    		authError,
    		isReady,
    		OIDC_CONTEXT_CLIENT_PROMISE,
    		OIDC_CONTEXT_REDIRECT_URI,
    		OIDC_CONTEXT_POST_LOGOUT_REDIRECT_URI,
    		refreshToken,
    		login,
    		logout,
    		issuer,
    		client_id,
    		redirect_uri,
    		post_logout_redirect_uri,
    		metadata,
    		scope,
    		settings,
    		userManager,
    		oidcPromise,
    		params,
    		handleOnMount,
    		handleOnDestroy,
    		$isAuthenticated
    	});

    	$$self.$inject_state = $$props => {
    		if ("issuer" in $$props) $$invalidate(0, issuer = $$props.issuer);
    		if ("client_id" in $$props) $$invalidate(1, client_id = $$props.client_id);
    		if ("redirect_uri" in $$props) $$invalidate(2, redirect_uri = $$props.redirect_uri);
    		if ("post_logout_redirect_uri" in $$props) $$invalidate(3, post_logout_redirect_uri = $$props.post_logout_redirect_uri);
    		if ("metadata" in $$props) $$invalidate(4, metadata = $$props.metadata);
    		if ("scope" in $$props) $$invalidate(5, scope = $$props.scope);
    		if ("oidcPromise" in $$props) oidcPromise = $$props.oidcPromise;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		issuer,
    		client_id,
    		redirect_uri,
    		post_logout_redirect_uri,
    		metadata,
    		scope,
    		$$scope,
    		slots
    	];
    }

    class OidcContext extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			issuer: 0,
    			client_id: 1,
    			redirect_uri: 2,
    			post_logout_redirect_uri: 3,
    			metadata: 4,
    			scope: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "OidcContext",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*issuer*/ ctx[0] === undefined && !("issuer" in props)) {
    			console.warn("<OidcContext> was created without expected prop 'issuer'");
    		}

    		if (/*client_id*/ ctx[1] === undefined && !("client_id" in props)) {
    			console.warn("<OidcContext> was created without expected prop 'client_id'");
    		}

    		if (/*redirect_uri*/ ctx[2] === undefined && !("redirect_uri" in props)) {
    			console.warn("<OidcContext> was created without expected prop 'redirect_uri'");
    		}

    		if (/*post_logout_redirect_uri*/ ctx[3] === undefined && !("post_logout_redirect_uri" in props)) {
    			console.warn("<OidcContext> was created without expected prop 'post_logout_redirect_uri'");
    		}
    	}

    	get issuer() {
    		throw new Error_1("<OidcContext>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set issuer(value) {
    		throw new Error_1("<OidcContext>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get client_id() {
    		throw new Error_1("<OidcContext>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set client_id(value) {
    		throw new Error_1("<OidcContext>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get redirect_uri() {
    		throw new Error_1("<OidcContext>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set redirect_uri(value) {
    		throw new Error_1("<OidcContext>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get post_logout_redirect_uri() {
    		throw new Error_1("<OidcContext>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set post_logout_redirect_uri(value) {
    		throw new Error_1("<OidcContext>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get metadata() {
    		throw new Error_1("<OidcContext>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set metadata(value) {
    		throw new Error_1("<OidcContext>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scope() {
    		throw new Error_1("<OidcContext>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scope(value) {
    		throw new Error_1("<OidcContext>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/c8s/LinkButton.svelte generated by Svelte v3.29.7 */

    const file$2 = "src/c8s/LinkButton.svelte";

    function create_fragment$4(ctx) {
    	let a;
    	let t;
    	let a_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text(/*name*/ ctx[0]);
    			attr_dev(a, "href", /*href*/ ctx[1]);

    			attr_dev(a, "class", a_class_value = "inline-block  " + (/*small*/ ctx[3]
    			? "px-2 py-1 text-xs"
    			: "px-4 py-2 text-sm") + " leading-none border rounded border-black\n   active:bg-gray-300 border-gray-500 lg:mt-0");

    			toggle_class(a, "bg-green-200", /*defaultAction*/ ctx[2]);
    			add_location(a, file$2, 7, 0, 145);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*click_handler*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*name*/ 1) set_data_dev(t, /*name*/ ctx[0]);

    			if (dirty & /*href*/ 2) {
    				attr_dev(a, "href", /*href*/ ctx[1]);
    			}

    			if (dirty & /*small*/ 8 && a_class_value !== (a_class_value = "inline-block  " + (/*small*/ ctx[3]
    			? "px-2 py-1 text-xs"
    			: "px-4 py-2 text-sm") + " leading-none border rounded border-black\n   active:bg-gray-300 border-gray-500 lg:mt-0")) {
    				attr_dev(a, "class", a_class_value);
    			}

    			if (dirty & /*small, defaultAction*/ 12) {
    				toggle_class(a, "bg-green-200", /*defaultAction*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("LinkButton", slots, []);
    	let { name = "Button" } = $$props;
    	let { href = "/" } = $$props;
    	let { defaultAction = false } = $$props;
    	let { small = false } = $$props;
    	const writable_props = ["name", "href", "defaultAction", "small"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<LinkButton> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("href" in $$props) $$invalidate(1, href = $$props.href);
    		if ("defaultAction" in $$props) $$invalidate(2, defaultAction = $$props.defaultAction);
    		if ("small" in $$props) $$invalidate(3, small = $$props.small);
    	};

    	$$self.$capture_state = () => ({ name, href, defaultAction, small });

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("href" in $$props) $$invalidate(1, href = $$props.href);
    		if ("defaultAction" in $$props) $$invalidate(2, defaultAction = $$props.defaultAction);
    		if ("small" in $$props) $$invalidate(3, small = $$props.small);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name, href, defaultAction, small, click_handler];
    }

    class LinkButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			name: 0,
    			href: 1,
    			defaultAction: 2,
    			small: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LinkButton",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get name() {
    		throw new Error("<LinkButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<LinkButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get href() {
    		throw new Error("<LinkButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
    		throw new Error("<LinkButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get defaultAction() {
    		throw new Error("<LinkButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set defaultAction(value) {
    		throw new Error("<LinkButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get small() {
    		throw new Error("<LinkButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set small(value) {
    		throw new Error("<LinkButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/c8s/Navigation.svelte generated by Svelte v3.29.7 */
    const file$3 = "src/c8s/Navigation.svelte";

    // (37:12) {#if !$isAuthenticated}
    function create_if_block_1(ctx) {
    	let linkbutton;
    	let current;

    	linkbutton = new LinkButton({
    			props: { name: "Login", href: "/" },
    			$$inline: true
    		});

    	linkbutton.$on("click", /*click_handler_1*/ ctx[4]);

    	const block = {
    		c: function create() {
    			create_component(linkbutton.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(linkbutton, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(linkbutton.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(linkbutton.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(linkbutton, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(37:12) {#if !$isAuthenticated}",
    		ctx
    	});

    	return block;
    }

    // (40:12) {#if $isAuthenticated}
    function create_if_block(ctx) {
    	let a;
    	let svg;
    	let path;
    	let t0;
    	let span;
    	let t1_value = /*$userInfo*/ ctx[2].preferred_username + "";
    	let t1;
    	let t2;
    	let linkbutton;
    	let current;

    	linkbutton = new LinkButton({
    			props: { name: "Logout", href: "/" },
    			$$inline: true
    		});

    	linkbutton.$on("click", /*click_handler_2*/ ctx[5]);

    	const block = {
    		c: function create() {
    			a = element("a");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t0 = space();
    			span = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			create_component(linkbutton.$$.fragment);
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "stroke-width", "2");
    			attr_dev(path, "d", "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z");
    			add_location(path, file$3, 42, 24, 2068);
    			attr_dev(svg, "class", "w-6");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke", "black");
    			add_location(svg, file$3, 41, 20, 1944);
    			add_location(span, file$3, 45, 20, 2289);
    			attr_dev(a, "href", "#/account");
    			attr_dev(a, "class", "mr-5 flex items-center text-sm");
    			add_location(a, file$3, 40, 16, 1864);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, svg);
    			append_dev(svg, path);
    			append_dev(a, t0);
    			append_dev(a, span);
    			append_dev(span, t1);
    			insert_dev(target, t2, anchor);
    			mount_component(linkbutton, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*$userInfo*/ 4) && t1_value !== (t1_value = /*$userInfo*/ ctx[2].preferred_username + "")) set_data_dev(t1, t1_value);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(linkbutton.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(linkbutton.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if (detaching) detach_dev(t2);
    			destroy_component(linkbutton, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(40:12) {#if $isAuthenticated}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let nav;
    	let div0;
    	let a0;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let div1;
    	let button;
    	let img1;
    	let img1_src_value;
    	let t1;
    	let div4;
    	let div2;
    	let a1;
    	let t3;
    	let a2;
    	let t5;
    	let a3;
    	let t7;
    	let div3;
    	let t8;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = !/*$isAuthenticated*/ ctx[1] && create_if_block_1(ctx);
    	let if_block1 = /*$isAuthenticated*/ ctx[1] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			div0 = element("div");
    			a0 = element("a");
    			img0 = element("img");
    			t0 = space();
    			div1 = element("div");
    			button = element("button");
    			img1 = element("img");
    			t1 = space();
    			div4 = element("div");
    			div2 = element("div");
    			a1 = element("a");
    			a1.textContent = "Tasks";
    			t3 = space();
    			a2 = element("a");
    			a2.textContent = "Projects";
    			t5 = space();
    			a3 = element("a");
    			a3.textContent = "Blog";
    			t7 = space();
    			div3 = element("div");
    			if (if_block0) if_block0.c();
    			t8 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(img0, "class", "w-32");
    			if (img0.src !== (img0_src_value = "/img/logo_1.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "logo");
    			add_location(img0, file$3, 10, 12, 363);
    			attr_dev(a0, "href", "#/");
    			add_location(a0, file$3, 9, 8, 337);
    			attr_dev(div0, "class", "flex items-center flex-shrink-0 text-white mr-6");
    			add_location(div0, file$3, 8, 4, 267);
    			if (img1.src !== (img1_src_value = "/img/dots-horizontal.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "class", "w-3");
    			attr_dev(img1, "alt", "");
    			add_location(img1, file$3, 16, 12, 684);
    			attr_dev(button, "class", "flex items-center px-3 py-2 border border-gray-500 rounded hover:text-gray-600 hover:border-gray-600 focus:outline-none");
    			add_location(button, file$3, 14, 8, 481);
    			attr_dev(div1, "class", "block lg:hidden");
    			add_location(div1, file$3, 13, 4, 443);
    			attr_dev(a1, "href", "#/tasks");
    			attr_dev(a1, "class", "block mt-4 lg:inline-block lg:mt-0 hover:text-gray-600 mr-4");
    			add_location(a1, file$3, 25, 12, 1201);
    			attr_dev(a2, "href", "#/projects");
    			attr_dev(a2, "class", "block mt-4 lg:inline-block lg:mt-0 hover:text-gray-600 mr-4");
    			add_location(a2, file$3, 28, 12, 1339);
    			attr_dev(a3, "href", "#responsive-header");
    			attr_dev(a3, "class", "block mt-4 lg:inline-block lg:mt-0 hover:text-gray-600");
    			add_location(a3, file$3, 31, 12, 1483);
    			attr_dev(div2, "class", "text-sm lg:flex-grow");
    			add_location(div2, file$3, 24, 8, 1154);
    			attr_dev(div3, "class", "flex items-center mt-4 lg:mt-0");
    			add_location(div3, file$3, 35, 8, 1637);
    			attr_dev(div4, "id", "collapsible");
    			attr_dev(div4, "class", "w-full block flex-grow lg:flex lg:items-center lg:w-auto");
    			toggle_class(div4, "hidden", /*menuHide*/ ctx[0]);
    			add_location(div4, file$3, 22, 4, 992);
    			attr_dev(nav, "class", "flex items-center justify-between flex-wrap p-6  border-b-2 lg:border-0");
    			add_location(nav, file$3, 7, 0, 177);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, div0);
    			append_dev(div0, a0);
    			append_dev(a0, img0);
    			append_dev(nav, t0);
    			append_dev(nav, div1);
    			append_dev(div1, button);
    			append_dev(button, img1);
    			append_dev(nav, t1);
    			append_dev(nav, div4);
    			append_dev(div4, div2);
    			append_dev(div2, a1);
    			append_dev(div2, t3);
    			append_dev(div2, a2);
    			append_dev(div2, t5);
    			append_dev(div2, a3);
    			append_dev(div4, t7);
    			append_dev(div4, div3);
    			if (if_block0) if_block0.m(div3, null);
    			append_dev(div3, t8);
    			if (if_block1) if_block1.m(div3, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", /*click_handler*/ ctx[3], false, false, false),
    					listen_dev(div4, "click", /*click_handler_3*/ ctx[6], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!/*$isAuthenticated*/ ctx[1]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*$isAuthenticated*/ 2) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div3, t8);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*$isAuthenticated*/ ctx[1]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*$isAuthenticated*/ 2) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div3, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*menuHide*/ 1) {
    				toggle_class(div4, "hidden", /*menuHide*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let $isAuthenticated;
    	let $userInfo;
    	validate_store(isAuthenticated, "isAuthenticated");
    	component_subscribe($$self, isAuthenticated, $$value => $$invalidate(1, $isAuthenticated = $$value));
    	validate_store(userInfo, "userInfo");
    	component_subscribe($$self, userInfo, $$value => $$invalidate(2, $userInfo = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Navigation", slots, []);
    	let menuHide = true;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Navigation> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(0, menuHide = !menuHide);
    	const click_handler_1 = () => login();
    	const click_handler_2 = () => logout();
    	const click_handler_3 = () => $$invalidate(0, menuHide = true);

    	$$self.$capture_state = () => ({
    		logout,
    		login,
    		isAuthenticated,
    		userInfo,
    		LinkButton,
    		menuHide,
    		$isAuthenticated,
    		$userInfo
    	});

    	$$self.$inject_state = $$props => {
    		if ("menuHide" in $$props) $$invalidate(0, menuHide = $$props.menuHide);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		menuHide,
    		$isAuthenticated,
    		$userInfo,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3
    	];
    }

    class Navigation extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navigation",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    var bind$1 = function bind(fn, thisArg) {
      return function wrap() {
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i];
        }
        return fn.apply(thisArg, args);
      };
    };

    /*global toString:true*/

    // utils is a library of generic helper functions non-specific to axios

    var toString = Object.prototype.toString;

    /**
     * Determine if a value is an Array
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an Array, otherwise false
     */
    function isArray(val) {
      return toString.call(val) === '[object Array]';
    }

    /**
     * Determine if a value is undefined
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if the value is undefined, otherwise false
     */
    function isUndefined(val) {
      return typeof val === 'undefined';
    }

    /**
     * Determine if a value is a Buffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Buffer, otherwise false
     */
    function isBuffer(val) {
      return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor)
        && typeof val.constructor.isBuffer === 'function' && val.constructor.isBuffer(val);
    }

    /**
     * Determine if a value is an ArrayBuffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an ArrayBuffer, otherwise false
     */
    function isArrayBuffer(val) {
      return toString.call(val) === '[object ArrayBuffer]';
    }

    /**
     * Determine if a value is a FormData
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an FormData, otherwise false
     */
    function isFormData(val) {
      return (typeof FormData !== 'undefined') && (val instanceof FormData);
    }

    /**
     * Determine if a value is a view on an ArrayBuffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
     */
    function isArrayBufferView(val) {
      var result;
      if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
        result = ArrayBuffer.isView(val);
      } else {
        result = (val) && (val.buffer) && (val.buffer instanceof ArrayBuffer);
      }
      return result;
    }

    /**
     * Determine if a value is a String
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a String, otherwise false
     */
    function isString(val) {
      return typeof val === 'string';
    }

    /**
     * Determine if a value is a Number
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Number, otherwise false
     */
    function isNumber(val) {
      return typeof val === 'number';
    }

    /**
     * Determine if a value is an Object
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an Object, otherwise false
     */
    function isObject(val) {
      return val !== null && typeof val === 'object';
    }

    /**
     * Determine if a value is a plain Object
     *
     * @param {Object} val The value to test
     * @return {boolean} True if value is a plain Object, otherwise false
     */
    function isPlainObject(val) {
      if (toString.call(val) !== '[object Object]') {
        return false;
      }

      var prototype = Object.getPrototypeOf(val);
      return prototype === null || prototype === Object.prototype;
    }

    /**
     * Determine if a value is a Date
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Date, otherwise false
     */
    function isDate(val) {
      return toString.call(val) === '[object Date]';
    }

    /**
     * Determine if a value is a File
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a File, otherwise false
     */
    function isFile(val) {
      return toString.call(val) === '[object File]';
    }

    /**
     * Determine if a value is a Blob
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Blob, otherwise false
     */
    function isBlob(val) {
      return toString.call(val) === '[object Blob]';
    }

    /**
     * Determine if a value is a Function
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Function, otherwise false
     */
    function isFunction(val) {
      return toString.call(val) === '[object Function]';
    }

    /**
     * Determine if a value is a Stream
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Stream, otherwise false
     */
    function isStream(val) {
      return isObject(val) && isFunction(val.pipe);
    }

    /**
     * Determine if a value is a URLSearchParams object
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a URLSearchParams object, otherwise false
     */
    function isURLSearchParams(val) {
      return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams;
    }

    /**
     * Trim excess whitespace off the beginning and end of a string
     *
     * @param {String} str The String to trim
     * @returns {String} The String freed of excess whitespace
     */
    function trim(str) {
      return str.replace(/^\s*/, '').replace(/\s*$/, '');
    }

    /**
     * Determine if we're running in a standard browser environment
     *
     * This allows axios to run in a web worker, and react-native.
     * Both environments support XMLHttpRequest, but not fully standard globals.
     *
     * web workers:
     *  typeof window -> undefined
     *  typeof document -> undefined
     *
     * react-native:
     *  navigator.product -> 'ReactNative'
     * nativescript
     *  navigator.product -> 'NativeScript' or 'NS'
     */
    function isStandardBrowserEnv() {
      if (typeof navigator !== 'undefined' && (navigator.product === 'ReactNative' ||
                                               navigator.product === 'NativeScript' ||
                                               navigator.product === 'NS')) {
        return false;
      }
      return (
        typeof window !== 'undefined' &&
        typeof document !== 'undefined'
      );
    }

    /**
     * Iterate over an Array or an Object invoking a function for each item.
     *
     * If `obj` is an Array callback will be called passing
     * the value, index, and complete array for each item.
     *
     * If 'obj' is an Object callback will be called passing
     * the value, key, and complete object for each property.
     *
     * @param {Object|Array} obj The object to iterate
     * @param {Function} fn The callback to invoke for each item
     */
    function forEach(obj, fn) {
      // Don't bother if no value provided
      if (obj === null || typeof obj === 'undefined') {
        return;
      }

      // Force an array if not already something iterable
      if (typeof obj !== 'object') {
        /*eslint no-param-reassign:0*/
        obj = [obj];
      }

      if (isArray(obj)) {
        // Iterate over array values
        for (var i = 0, l = obj.length; i < l; i++) {
          fn.call(null, obj[i], i, obj);
        }
      } else {
        // Iterate over object keys
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            fn.call(null, obj[key], key, obj);
          }
        }
      }
    }

    /**
     * Accepts varargs expecting each argument to be an object, then
     * immutably merges the properties of each object and returns result.
     *
     * When multiple objects contain the same key the later object in
     * the arguments list will take precedence.
     *
     * Example:
     *
     * ```js
     * var result = merge({foo: 123}, {foo: 456});
     * console.log(result.foo); // outputs 456
     * ```
     *
     * @param {Object} obj1 Object to merge
     * @returns {Object} Result of all merge properties
     */
    function merge(/* obj1, obj2, obj3, ... */) {
      var result = {};
      function assignValue(val, key) {
        if (isPlainObject(result[key]) && isPlainObject(val)) {
          result[key] = merge(result[key], val);
        } else if (isPlainObject(val)) {
          result[key] = merge({}, val);
        } else if (isArray(val)) {
          result[key] = val.slice();
        } else {
          result[key] = val;
        }
      }

      for (var i = 0, l = arguments.length; i < l; i++) {
        forEach(arguments[i], assignValue);
      }
      return result;
    }

    /**
     * Extends object a by mutably adding to it the properties of object b.
     *
     * @param {Object} a The object to be extended
     * @param {Object} b The object to copy properties from
     * @param {Object} thisArg The object to bind function to
     * @return {Object} The resulting value of object a
     */
    function extend(a, b, thisArg) {
      forEach(b, function assignValue(val, key) {
        if (thisArg && typeof val === 'function') {
          a[key] = bind$1(val, thisArg);
        } else {
          a[key] = val;
        }
      });
      return a;
    }

    /**
     * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
     *
     * @param {string} content with BOM
     * @return {string} content value without BOM
     */
    function stripBOM(content) {
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }
      return content;
    }

    var utils = {
      isArray: isArray,
      isArrayBuffer: isArrayBuffer,
      isBuffer: isBuffer,
      isFormData: isFormData,
      isArrayBufferView: isArrayBufferView,
      isString: isString,
      isNumber: isNumber,
      isObject: isObject,
      isPlainObject: isPlainObject,
      isUndefined: isUndefined,
      isDate: isDate,
      isFile: isFile,
      isBlob: isBlob,
      isFunction: isFunction,
      isStream: isStream,
      isURLSearchParams: isURLSearchParams,
      isStandardBrowserEnv: isStandardBrowserEnv,
      forEach: forEach,
      merge: merge,
      extend: extend,
      trim: trim,
      stripBOM: stripBOM
    };

    function encode(val) {
      return encodeURIComponent(val).
        replace(/%3A/gi, ':').
        replace(/%24/g, '$').
        replace(/%2C/gi, ',').
        replace(/%20/g, '+').
        replace(/%5B/gi, '[').
        replace(/%5D/gi, ']');
    }

    /**
     * Build a URL by appending params to the end
     *
     * @param {string} url The base of the url (e.g., http://www.google.com)
     * @param {object} [params] The params to be appended
     * @returns {string} The formatted url
     */
    var buildURL = function buildURL(url, params, paramsSerializer) {
      /*eslint no-param-reassign:0*/
      if (!params) {
        return url;
      }

      var serializedParams;
      if (paramsSerializer) {
        serializedParams = paramsSerializer(params);
      } else if (utils.isURLSearchParams(params)) {
        serializedParams = params.toString();
      } else {
        var parts = [];

        utils.forEach(params, function serialize(val, key) {
          if (val === null || typeof val === 'undefined') {
            return;
          }

          if (utils.isArray(val)) {
            key = key + '[]';
          } else {
            val = [val];
          }

          utils.forEach(val, function parseValue(v) {
            if (utils.isDate(v)) {
              v = v.toISOString();
            } else if (utils.isObject(v)) {
              v = JSON.stringify(v);
            }
            parts.push(encode(key) + '=' + encode(v));
          });
        });

        serializedParams = parts.join('&');
      }

      if (serializedParams) {
        var hashmarkIndex = url.indexOf('#');
        if (hashmarkIndex !== -1) {
          url = url.slice(0, hashmarkIndex);
        }

        url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
      }

      return url;
    };

    function InterceptorManager() {
      this.handlers = [];
    }

    /**
     * Add a new interceptor to the stack
     *
     * @param {Function} fulfilled The function to handle `then` for a `Promise`
     * @param {Function} rejected The function to handle `reject` for a `Promise`
     *
     * @return {Number} An ID used to remove interceptor later
     */
    InterceptorManager.prototype.use = function use(fulfilled, rejected) {
      this.handlers.push({
        fulfilled: fulfilled,
        rejected: rejected
      });
      return this.handlers.length - 1;
    };

    /**
     * Remove an interceptor from the stack
     *
     * @param {Number} id The ID that was returned by `use`
     */
    InterceptorManager.prototype.eject = function eject(id) {
      if (this.handlers[id]) {
        this.handlers[id] = null;
      }
    };

    /**
     * Iterate over all the registered interceptors
     *
     * This method is particularly useful for skipping over any
     * interceptors that may have become `null` calling `eject`.
     *
     * @param {Function} fn The function to call for each interceptor
     */
    InterceptorManager.prototype.forEach = function forEach(fn) {
      utils.forEach(this.handlers, function forEachHandler(h) {
        if (h !== null) {
          fn(h);
        }
      });
    };

    var InterceptorManager_1 = InterceptorManager;

    /**
     * Transform the data for a request or a response
     *
     * @param {Object|String} data The data to be transformed
     * @param {Array} headers The headers for the request or response
     * @param {Array|Function} fns A single function or Array of functions
     * @returns {*} The resulting transformed data
     */
    var transformData = function transformData(data, headers, fns) {
      /*eslint no-param-reassign:0*/
      utils.forEach(fns, function transform(fn) {
        data = fn(data, headers);
      });

      return data;
    };

    var isCancel = function isCancel(value) {
      return !!(value && value.__CANCEL__);
    };

    var normalizeHeaderName = function normalizeHeaderName(headers, normalizedName) {
      utils.forEach(headers, function processHeader(value, name) {
        if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
          headers[normalizedName] = value;
          delete headers[name];
        }
      });
    };

    /**
     * Update an Error with the specified config, error code, and response.
     *
     * @param {Error} error The error to update.
     * @param {Object} config The config.
     * @param {string} [code] The error code (for example, 'ECONNABORTED').
     * @param {Object} [request] The request.
     * @param {Object} [response] The response.
     * @returns {Error} The error.
     */
    var enhanceError = function enhanceError(error, config, code, request, response) {
      error.config = config;
      if (code) {
        error.code = code;
      }

      error.request = request;
      error.response = response;
      error.isAxiosError = true;

      error.toJSON = function toJSON() {
        return {
          // Standard
          message: this.message,
          name: this.name,
          // Microsoft
          description: this.description,
          number: this.number,
          // Mozilla
          fileName: this.fileName,
          lineNumber: this.lineNumber,
          columnNumber: this.columnNumber,
          stack: this.stack,
          // Axios
          config: this.config,
          code: this.code
        };
      };
      return error;
    };

    /**
     * Create an Error with the specified message, config, error code, request and response.
     *
     * @param {string} message The error message.
     * @param {Object} config The config.
     * @param {string} [code] The error code (for example, 'ECONNABORTED').
     * @param {Object} [request] The request.
     * @param {Object} [response] The response.
     * @returns {Error} The created error.
     */
    var createError = function createError(message, config, code, request, response) {
      var error = new Error(message);
      return enhanceError(error, config, code, request, response);
    };

    /**
     * Resolve or reject a Promise based on response status.
     *
     * @param {Function} resolve A function that resolves the promise.
     * @param {Function} reject A function that rejects the promise.
     * @param {object} response The response.
     */
    var settle = function settle(resolve, reject, response) {
      var validateStatus = response.config.validateStatus;
      if (!response.status || !validateStatus || validateStatus(response.status)) {
        resolve(response);
      } else {
        reject(createError(
          'Request failed with status code ' + response.status,
          response.config,
          null,
          response.request,
          response
        ));
      }
    };

    var cookies = (
      utils.isStandardBrowserEnv() ?

      // Standard browser envs support document.cookie
        (function standardBrowserEnv() {
          return {
            write: function write(name, value, expires, path, domain, secure) {
              var cookie = [];
              cookie.push(name + '=' + encodeURIComponent(value));

              if (utils.isNumber(expires)) {
                cookie.push('expires=' + new Date(expires).toGMTString());
              }

              if (utils.isString(path)) {
                cookie.push('path=' + path);
              }

              if (utils.isString(domain)) {
                cookie.push('domain=' + domain);
              }

              if (secure === true) {
                cookie.push('secure');
              }

              document.cookie = cookie.join('; ');
            },

            read: function read(name) {
              var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
              return (match ? decodeURIComponent(match[3]) : null);
            },

            remove: function remove(name) {
              this.write(name, '', Date.now() - 86400000);
            }
          };
        })() :

      // Non standard browser env (web workers, react-native) lack needed support.
        (function nonStandardBrowserEnv() {
          return {
            write: function write() {},
            read: function read() { return null; },
            remove: function remove() {}
          };
        })()
    );

    /**
     * Determines whether the specified URL is absolute
     *
     * @param {string} url The URL to test
     * @returns {boolean} True if the specified URL is absolute, otherwise false
     */
    var isAbsoluteURL = function isAbsoluteURL(url) {
      // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
      // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
      // by any combination of letters, digits, plus, period, or hyphen.
      return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
    };

    /**
     * Creates a new URL by combining the specified URLs
     *
     * @param {string} baseURL The base URL
     * @param {string} relativeURL The relative URL
     * @returns {string} The combined URL
     */
    var combineURLs = function combineURLs(baseURL, relativeURL) {
      return relativeURL
        ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
        : baseURL;
    };

    /**
     * Creates a new URL by combining the baseURL with the requestedURL,
     * only when the requestedURL is not already an absolute URL.
     * If the requestURL is absolute, this function returns the requestedURL untouched.
     *
     * @param {string} baseURL The base URL
     * @param {string} requestedURL Absolute or relative URL to combine
     * @returns {string} The combined full path
     */
    var buildFullPath = function buildFullPath(baseURL, requestedURL) {
      if (baseURL && !isAbsoluteURL(requestedURL)) {
        return combineURLs(baseURL, requestedURL);
      }
      return requestedURL;
    };

    // Headers whose duplicates are ignored by node
    // c.f. https://nodejs.org/api/http.html#http_message_headers
    var ignoreDuplicateOf = [
      'age', 'authorization', 'content-length', 'content-type', 'etag',
      'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
      'last-modified', 'location', 'max-forwards', 'proxy-authorization',
      'referer', 'retry-after', 'user-agent'
    ];

    /**
     * Parse headers into an object
     *
     * ```
     * Date: Wed, 27 Aug 2014 08:58:49 GMT
     * Content-Type: application/json
     * Connection: keep-alive
     * Transfer-Encoding: chunked
     * ```
     *
     * @param {String} headers Headers needing to be parsed
     * @returns {Object} Headers parsed into an object
     */
    var parseHeaders = function parseHeaders(headers) {
      var parsed = {};
      var key;
      var val;
      var i;

      if (!headers) { return parsed; }

      utils.forEach(headers.split('\n'), function parser(line) {
        i = line.indexOf(':');
        key = utils.trim(line.substr(0, i)).toLowerCase();
        val = utils.trim(line.substr(i + 1));

        if (key) {
          if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
            return;
          }
          if (key === 'set-cookie') {
            parsed[key] = (parsed[key] ? parsed[key] : []).concat([val]);
          } else {
            parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
          }
        }
      });

      return parsed;
    };

    var isURLSameOrigin = (
      utils.isStandardBrowserEnv() ?

      // Standard browser envs have full support of the APIs needed to test
      // whether the request URL is of the same origin as current location.
        (function standardBrowserEnv() {
          var msie = /(msie|trident)/i.test(navigator.userAgent);
          var urlParsingNode = document.createElement('a');
          var originURL;

          /**
        * Parse a URL to discover it's components
        *
        * @param {String} url The URL to be parsed
        * @returns {Object}
        */
          function resolveURL(url) {
            var href = url;

            if (msie) {
            // IE needs attribute set twice to normalize properties
              urlParsingNode.setAttribute('href', href);
              href = urlParsingNode.href;
            }

            urlParsingNode.setAttribute('href', href);

            // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
            return {
              href: urlParsingNode.href,
              protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
              host: urlParsingNode.host,
              search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
              hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
              hostname: urlParsingNode.hostname,
              port: urlParsingNode.port,
              pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
                urlParsingNode.pathname :
                '/' + urlParsingNode.pathname
            };
          }

          originURL = resolveURL(window.location.href);

          /**
        * Determine if a URL shares the same origin as the current location
        *
        * @param {String} requestURL The URL to test
        * @returns {boolean} True if URL shares the same origin, otherwise false
        */
          return function isURLSameOrigin(requestURL) {
            var parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
            return (parsed.protocol === originURL.protocol &&
                parsed.host === originURL.host);
          };
        })() :

      // Non standard browser envs (web workers, react-native) lack needed support.
        (function nonStandardBrowserEnv() {
          return function isURLSameOrigin() {
            return true;
          };
        })()
    );

    var xhr = function xhrAdapter(config) {
      return new Promise(function dispatchXhrRequest(resolve, reject) {
        var requestData = config.data;
        var requestHeaders = config.headers;

        if (utils.isFormData(requestData)) {
          delete requestHeaders['Content-Type']; // Let the browser set it
        }

        var request = new XMLHttpRequest();

        // HTTP basic authentication
        if (config.auth) {
          var username = config.auth.username || '';
          var password = config.auth.password ? unescape(encodeURIComponent(config.auth.password)) : '';
          requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
        }

        var fullPath = buildFullPath(config.baseURL, config.url);
        request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);

        // Set the request timeout in MS
        request.timeout = config.timeout;

        // Listen for ready state
        request.onreadystatechange = function handleLoad() {
          if (!request || request.readyState !== 4) {
            return;
          }

          // The request errored out and we didn't get a response, this will be
          // handled by onerror instead
          // With one exception: request that using file: protocol, most browsers
          // will return status as 0 even though it's a successful request
          if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
            return;
          }

          // Prepare the response
          var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
          var responseData = !config.responseType || config.responseType === 'text' ? request.responseText : request.response;
          var response = {
            data: responseData,
            status: request.status,
            statusText: request.statusText,
            headers: responseHeaders,
            config: config,
            request: request
          };

          settle(resolve, reject, response);

          // Clean up request
          request = null;
        };

        // Handle browser request cancellation (as opposed to a manual cancellation)
        request.onabort = function handleAbort() {
          if (!request) {
            return;
          }

          reject(createError('Request aborted', config, 'ECONNABORTED', request));

          // Clean up request
          request = null;
        };

        // Handle low level network errors
        request.onerror = function handleError() {
          // Real errors are hidden from us by the browser
          // onerror should only fire if it's a network error
          reject(createError('Network Error', config, null, request));

          // Clean up request
          request = null;
        };

        // Handle timeout
        request.ontimeout = function handleTimeout() {
          var timeoutErrorMessage = 'timeout of ' + config.timeout + 'ms exceeded';
          if (config.timeoutErrorMessage) {
            timeoutErrorMessage = config.timeoutErrorMessage;
          }
          reject(createError(timeoutErrorMessage, config, 'ECONNABORTED',
            request));

          // Clean up request
          request = null;
        };

        // Add xsrf header
        // This is only done if running in a standard browser environment.
        // Specifically not if we're in a web worker, or react-native.
        if (utils.isStandardBrowserEnv()) {
          // Add xsrf header
          var xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath)) && config.xsrfCookieName ?
            cookies.read(config.xsrfCookieName) :
            undefined;

          if (xsrfValue) {
            requestHeaders[config.xsrfHeaderName] = xsrfValue;
          }
        }

        // Add headers to the request
        if ('setRequestHeader' in request) {
          utils.forEach(requestHeaders, function setRequestHeader(val, key) {
            if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
              // Remove Content-Type if data is undefined
              delete requestHeaders[key];
            } else {
              // Otherwise add header to the request
              request.setRequestHeader(key, val);
            }
          });
        }

        // Add withCredentials to request if needed
        if (!utils.isUndefined(config.withCredentials)) {
          request.withCredentials = !!config.withCredentials;
        }

        // Add responseType to request if needed
        if (config.responseType) {
          try {
            request.responseType = config.responseType;
          } catch (e) {
            // Expected DOMException thrown by browsers not compatible XMLHttpRequest Level 2.
            // But, this can be suppressed for 'json' type as it can be parsed by default 'transformResponse' function.
            if (config.responseType !== 'json') {
              throw e;
            }
          }
        }

        // Handle progress if needed
        if (typeof config.onDownloadProgress === 'function') {
          request.addEventListener('progress', config.onDownloadProgress);
        }

        // Not all browsers support upload events
        if (typeof config.onUploadProgress === 'function' && request.upload) {
          request.upload.addEventListener('progress', config.onUploadProgress);
        }

        if (config.cancelToken) {
          // Handle cancellation
          config.cancelToken.promise.then(function onCanceled(cancel) {
            if (!request) {
              return;
            }

            request.abort();
            reject(cancel);
            // Clean up request
            request = null;
          });
        }

        if (!requestData) {
          requestData = null;
        }

        // Send the request
        request.send(requestData);
      });
    };

    var DEFAULT_CONTENT_TYPE = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    function setContentTypeIfUnset(headers, value) {
      if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
        headers['Content-Type'] = value;
      }
    }

    function getDefaultAdapter() {
      var adapter;
      if (typeof XMLHttpRequest !== 'undefined') {
        // For browsers use XHR adapter
        adapter = xhr;
      } else if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
        // For node use HTTP adapter
        adapter = xhr;
      }
      return adapter;
    }

    var defaults = {
      adapter: getDefaultAdapter(),

      transformRequest: [function transformRequest(data, headers) {
        normalizeHeaderName(headers, 'Accept');
        normalizeHeaderName(headers, 'Content-Type');
        if (utils.isFormData(data) ||
          utils.isArrayBuffer(data) ||
          utils.isBuffer(data) ||
          utils.isStream(data) ||
          utils.isFile(data) ||
          utils.isBlob(data)
        ) {
          return data;
        }
        if (utils.isArrayBufferView(data)) {
          return data.buffer;
        }
        if (utils.isURLSearchParams(data)) {
          setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
          return data.toString();
        }
        if (utils.isObject(data)) {
          setContentTypeIfUnset(headers, 'application/json;charset=utf-8');
          return JSON.stringify(data);
        }
        return data;
      }],

      transformResponse: [function transformResponse(data) {
        /*eslint no-param-reassign:0*/
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch (e) { /* Ignore */ }
        }
        return data;
      }],

      /**
       * A timeout in milliseconds to abort a request. If set to 0 (default) a
       * timeout is not created.
       */
      timeout: 0,

      xsrfCookieName: 'XSRF-TOKEN',
      xsrfHeaderName: 'X-XSRF-TOKEN',

      maxContentLength: -1,
      maxBodyLength: -1,

      validateStatus: function validateStatus(status) {
        return status >= 200 && status < 300;
      }
    };

    defaults.headers = {
      common: {
        'Accept': 'application/json, text/plain, */*'
      }
    };

    utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
      defaults.headers[method] = {};
    });

    utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
      defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
    });

    var defaults_1 = defaults;

    /**
     * Throws a `Cancel` if cancellation has been requested.
     */
    function throwIfCancellationRequested(config) {
      if (config.cancelToken) {
        config.cancelToken.throwIfRequested();
      }
    }

    /**
     * Dispatch a request to the server using the configured adapter.
     *
     * @param {object} config The config that is to be used for the request
     * @returns {Promise} The Promise to be fulfilled
     */
    var dispatchRequest = function dispatchRequest(config) {
      throwIfCancellationRequested(config);

      // Ensure headers exist
      config.headers = config.headers || {};

      // Transform request data
      config.data = transformData(
        config.data,
        config.headers,
        config.transformRequest
      );

      // Flatten headers
      config.headers = utils.merge(
        config.headers.common || {},
        config.headers[config.method] || {},
        config.headers
      );

      utils.forEach(
        ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
        function cleanHeaderConfig(method) {
          delete config.headers[method];
        }
      );

      var adapter = config.adapter || defaults_1.adapter;

      return adapter(config).then(function onAdapterResolution(response) {
        throwIfCancellationRequested(config);

        // Transform response data
        response.data = transformData(
          response.data,
          response.headers,
          config.transformResponse
        );

        return response;
      }, function onAdapterRejection(reason) {
        if (!isCancel(reason)) {
          throwIfCancellationRequested(config);

          // Transform response data
          if (reason && reason.response) {
            reason.response.data = transformData(
              reason.response.data,
              reason.response.headers,
              config.transformResponse
            );
          }
        }

        return Promise.reject(reason);
      });
    };

    /**
     * Config-specific merge-function which creates a new config-object
     * by merging two configuration objects together.
     *
     * @param {Object} config1
     * @param {Object} config2
     * @returns {Object} New object resulting from merging config2 to config1
     */
    var mergeConfig = function mergeConfig(config1, config2) {
      // eslint-disable-next-line no-param-reassign
      config2 = config2 || {};
      var config = {};

      var valueFromConfig2Keys = ['url', 'method', 'data'];
      var mergeDeepPropertiesKeys = ['headers', 'auth', 'proxy', 'params'];
      var defaultToConfig2Keys = [
        'baseURL', 'transformRequest', 'transformResponse', 'paramsSerializer',
        'timeout', 'timeoutMessage', 'withCredentials', 'adapter', 'responseType', 'xsrfCookieName',
        'xsrfHeaderName', 'onUploadProgress', 'onDownloadProgress', 'decompress',
        'maxContentLength', 'maxBodyLength', 'maxRedirects', 'transport', 'httpAgent',
        'httpsAgent', 'cancelToken', 'socketPath', 'responseEncoding'
      ];
      var directMergeKeys = ['validateStatus'];

      function getMergedValue(target, source) {
        if (utils.isPlainObject(target) && utils.isPlainObject(source)) {
          return utils.merge(target, source);
        } else if (utils.isPlainObject(source)) {
          return utils.merge({}, source);
        } else if (utils.isArray(source)) {
          return source.slice();
        }
        return source;
      }

      function mergeDeepProperties(prop) {
        if (!utils.isUndefined(config2[prop])) {
          config[prop] = getMergedValue(config1[prop], config2[prop]);
        } else if (!utils.isUndefined(config1[prop])) {
          config[prop] = getMergedValue(undefined, config1[prop]);
        }
      }

      utils.forEach(valueFromConfig2Keys, function valueFromConfig2(prop) {
        if (!utils.isUndefined(config2[prop])) {
          config[prop] = getMergedValue(undefined, config2[prop]);
        }
      });

      utils.forEach(mergeDeepPropertiesKeys, mergeDeepProperties);

      utils.forEach(defaultToConfig2Keys, function defaultToConfig2(prop) {
        if (!utils.isUndefined(config2[prop])) {
          config[prop] = getMergedValue(undefined, config2[prop]);
        } else if (!utils.isUndefined(config1[prop])) {
          config[prop] = getMergedValue(undefined, config1[prop]);
        }
      });

      utils.forEach(directMergeKeys, function merge(prop) {
        if (prop in config2) {
          config[prop] = getMergedValue(config1[prop], config2[prop]);
        } else if (prop in config1) {
          config[prop] = getMergedValue(undefined, config1[prop]);
        }
      });

      var axiosKeys = valueFromConfig2Keys
        .concat(mergeDeepPropertiesKeys)
        .concat(defaultToConfig2Keys)
        .concat(directMergeKeys);

      var otherKeys = Object
        .keys(config1)
        .concat(Object.keys(config2))
        .filter(function filterAxiosKeys(key) {
          return axiosKeys.indexOf(key) === -1;
        });

      utils.forEach(otherKeys, mergeDeepProperties);

      return config;
    };

    /**
     * Create a new instance of Axios
     *
     * @param {Object} instanceConfig The default config for the instance
     */
    function Axios(instanceConfig) {
      this.defaults = instanceConfig;
      this.interceptors = {
        request: new InterceptorManager_1(),
        response: new InterceptorManager_1()
      };
    }

    /**
     * Dispatch a request
     *
     * @param {Object} config The config specific for this request (merged with this.defaults)
     */
    Axios.prototype.request = function request(config) {
      /*eslint no-param-reassign:0*/
      // Allow for axios('example/url'[, config]) a la fetch API
      if (typeof config === 'string') {
        config = arguments[1] || {};
        config.url = arguments[0];
      } else {
        config = config || {};
      }

      config = mergeConfig(this.defaults, config);

      // Set config.method
      if (config.method) {
        config.method = config.method.toLowerCase();
      } else if (this.defaults.method) {
        config.method = this.defaults.method.toLowerCase();
      } else {
        config.method = 'get';
      }

      // Hook up interceptors middleware
      var chain = [dispatchRequest, undefined];
      var promise = Promise.resolve(config);

      this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
        chain.unshift(interceptor.fulfilled, interceptor.rejected);
      });

      this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
        chain.push(interceptor.fulfilled, interceptor.rejected);
      });

      while (chain.length) {
        promise = promise.then(chain.shift(), chain.shift());
      }

      return promise;
    };

    Axios.prototype.getUri = function getUri(config) {
      config = mergeConfig(this.defaults, config);
      return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\?/, '');
    };

    // Provide aliases for supported request methods
    utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
      /*eslint func-names:0*/
      Axios.prototype[method] = function(url, config) {
        return this.request(mergeConfig(config || {}, {
          method: method,
          url: url,
          data: (config || {}).data
        }));
      };
    });

    utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
      /*eslint func-names:0*/
      Axios.prototype[method] = function(url, data, config) {
        return this.request(mergeConfig(config || {}, {
          method: method,
          url: url,
          data: data
        }));
      };
    });

    var Axios_1 = Axios;

    /**
     * A `Cancel` is an object that is thrown when an operation is canceled.
     *
     * @class
     * @param {string=} message The message.
     */
    function Cancel(message) {
      this.message = message;
    }

    Cancel.prototype.toString = function toString() {
      return 'Cancel' + (this.message ? ': ' + this.message : '');
    };

    Cancel.prototype.__CANCEL__ = true;

    var Cancel_1 = Cancel;

    /**
     * A `CancelToken` is an object that can be used to request cancellation of an operation.
     *
     * @class
     * @param {Function} executor The executor function.
     */
    function CancelToken(executor) {
      if (typeof executor !== 'function') {
        throw new TypeError('executor must be a function.');
      }

      var resolvePromise;
      this.promise = new Promise(function promiseExecutor(resolve) {
        resolvePromise = resolve;
      });

      var token = this;
      executor(function cancel(message) {
        if (token.reason) {
          // Cancellation has already been requested
          return;
        }

        token.reason = new Cancel_1(message);
        resolvePromise(token.reason);
      });
    }

    /**
     * Throws a `Cancel` if cancellation has been requested.
     */
    CancelToken.prototype.throwIfRequested = function throwIfRequested() {
      if (this.reason) {
        throw this.reason;
      }
    };

    /**
     * Returns an object that contains a new `CancelToken` and a function that, when called,
     * cancels the `CancelToken`.
     */
    CancelToken.source = function source() {
      var cancel;
      var token = new CancelToken(function executor(c) {
        cancel = c;
      });
      return {
        token: token,
        cancel: cancel
      };
    };

    var CancelToken_1 = CancelToken;

    /**
     * Syntactic sugar for invoking a function and expanding an array for arguments.
     *
     * Common use case would be to use `Function.prototype.apply`.
     *
     *  ```js
     *  function f(x, y, z) {}
     *  var args = [1, 2, 3];
     *  f.apply(null, args);
     *  ```
     *
     * With `spread` this example can be re-written.
     *
     *  ```js
     *  spread(function(x, y, z) {})([1, 2, 3]);
     *  ```
     *
     * @param {Function} callback
     * @returns {Function}
     */
    var spread = function spread(callback) {
      return function wrap(arr) {
        return callback.apply(null, arr);
      };
    };

    /**
     * Create an instance of Axios
     *
     * @param {Object} defaultConfig The default config for the instance
     * @return {Axios} A new instance of Axios
     */
    function createInstance(defaultConfig) {
      var context = new Axios_1(defaultConfig);
      var instance = bind$1(Axios_1.prototype.request, context);

      // Copy axios.prototype to instance
      utils.extend(instance, Axios_1.prototype, context);

      // Copy context to instance
      utils.extend(instance, context);

      return instance;
    }

    // Create the default instance to be exported
    var axios = createInstance(defaults_1);

    // Expose Axios class to allow class inheritance
    axios.Axios = Axios_1;

    // Factory for creating new instances
    axios.create = function create(instanceConfig) {
      return createInstance(mergeConfig(axios.defaults, instanceConfig));
    };

    // Expose Cancel & CancelToken
    axios.Cancel = Cancel_1;
    axios.CancelToken = CancelToken_1;
    axios.isCancel = isCancel;

    // Expose all/spread
    axios.all = function all(promises) {
      return Promise.all(promises);
    };
    axios.spread = spread;

    var axios_1 = axios;

    // Allow use of default import syntax in TypeScript
    var _default = axios;
    axios_1.default = _default;

    var axios$1 = axios_1;

    class Api {

        baseUrl = "http://mytrack-front:8080/api/v1";

        defineHeaders() {
            axios$1.defaults.headers.common['Authorization'] = 'Bearer ' + get_store_value(accessToken);
        }

        async getProject(id) {
            this.defineHeaders();
            return axios$1
                .get(`${this.baseUrl}/projects/${id}`)
                .then(response => response.data)
                .catch(err => {
                    console.log(err);
                })
        }

        async getProjects() {
            this.defineHeaders();
            return axios$1
                .get(`${this.baseUrl}/projects`)
                .then(response => response.data)
                .catch(err => {
                    console.log(err);
                })
        }

        async saveProject(project) {
            this.defineHeaders();
            return axios$1
                .post(`${this.baseUrl}/projects`, project)
                .then(response => response.data)
                .catch(err => console.log(err));
        }


        async getProjectIssues(projectId) {
            this.defineHeaders();
            return axios$1
                .get(`${this.baseUrl}/projects/${projectId}/issues`)
                .then(response => response.data)
                .catch(err => console.log(err));
        }

        async getProjectIssue(projectId, issueId) {
            this.defineHeaders();
            return axios$1
                .get(`${this.baseUrl}/projects/${projectId}/issues/${issueId}`)
                .then(response => response.data)
                .catch(err => {
                    console.log(err);
                })
        }

        async saveProjectIssue(projectId, issue) {
            this.defineHeaders();
            return axios$1
                .post(`${this.baseUrl}/projects/${projectId}/issues`, issue)
                .then(response => response.data)
                .catch(err => console.log(err));

        }

        async deleteProjectIssue(projectId, issueId) {
            this.defineHeaders();
            return axios$1
                .delete(`${this.baseUrl}/projects/${projectId}/issues/${issueId}`)
                .then(response => {})
                .catch(err => console.log(err))
        }
    }

    /* src/c8s/ProjectCard.svelte generated by Svelte v3.29.7 */

    const file$4 = "src/c8s/ProjectCard.svelte";

    function create_fragment$6(ctx) {
    	let div3;
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let a;
    	let div0;
    	let t1;
    	let a_href_value;
    	let t2;
    	let div2;
    	let t3;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			a = element("a");
    			div0 = element("div");
    			t1 = text(/*title*/ ctx[1]);
    			t2 = space();
    			div2 = element("div");
    			t3 = text(/*desc*/ ctx[2]);
    			attr_dev(img, "class", "w-5 mr-2");
    			if (img.src !== (img_src_value = "/img/project.svg")) attr_dev(img, "src", img_src_value);
    			add_location(img, file$4, 8, 8, 200);
    			attr_dev(div0, "class", "text-lg");
    			add_location(div0, file$4, 10, 12, 293);
    			attr_dev(a, "href", a_href_value = "#/projects/" + /*id*/ ctx[0]);
    			add_location(a, file$4, 9, 8, 254);
    			attr_dev(div1, "class", "flex");
    			add_location(div1, file$4, 7, 4, 173);
    			attr_dev(div2, "class", "text-sm");
    			add_location(div2, file$4, 13, 4, 356);
    			attr_dev(div3, "class", "flex flex-col p-2 border rounded-sm w-full md:w-1/2 mb-2 mx-2 bg-gray-100");
    			add_location(div3, file$4, 6, 0, 81);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div1);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, a);
    			append_dev(a, div0);
    			append_dev(div0, t1);
    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			append_dev(div2, t3);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*title*/ 2) set_data_dev(t1, /*title*/ ctx[1]);

    			if (dirty & /*id*/ 1 && a_href_value !== (a_href_value = "#/projects/" + /*id*/ ctx[0])) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (dirty & /*desc*/ 4) set_data_dev(t3, /*desc*/ ctx[2]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ProjectCard", slots, []);
    	let { id } = $$props;
    	let { title } = $$props;
    	let { desc } = $$props;
    	const writable_props = ["id", "title", "desc"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ProjectCard> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("id" in $$props) $$invalidate(0, id = $$props.id);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("desc" in $$props) $$invalidate(2, desc = $$props.desc);
    	};

    	$$self.$capture_state = () => ({ id, title, desc });

    	$$self.$inject_state = $$props => {
    		if ("id" in $$props) $$invalidate(0, id = $$props.id);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("desc" in $$props) $$invalidate(2, desc = $$props.desc);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [id, title, desc];
    }

    class ProjectCard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { id: 0, title: 1, desc: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ProjectCard",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*id*/ ctx[0] === undefined && !("id" in props)) {
    			console.warn("<ProjectCard> was created without expected prop 'id'");
    		}

    		if (/*title*/ ctx[1] === undefined && !("title" in props)) {
    			console.warn("<ProjectCard> was created without expected prop 'title'");
    		}

    		if (/*desc*/ ctx[2] === undefined && !("desc" in props)) {
    			console.warn("<ProjectCard> was created without expected prop 'desc'");
    		}
    	}

    	get id() {
    		throw new Error("<ProjectCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<ProjectCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<ProjectCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<ProjectCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get desc() {
    		throw new Error("<ProjectCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set desc(value) {
    		throw new Error("<ProjectCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/c8s/ProjectList.svelte generated by Svelte v3.29.7 */
    const file$5 = "src/c8s/ProjectList.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (26:0) {#each projects as p}
    function create_each_block(ctx) {
    	let projectcard;
    	let current;

    	projectcard = new ProjectCard({
    			props: {
    				id: /*p*/ ctx[1].project.id,
    				title: /*p*/ ctx[1].project.title,
    				desc: /*p*/ ctx[1].project.description
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(projectcard.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(projectcard, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const projectcard_changes = {};
    			if (dirty & /*projects*/ 1) projectcard_changes.id = /*p*/ ctx[1].project.id;
    			if (dirty & /*projects*/ 1) projectcard_changes.title = /*p*/ ctx[1].project.title;
    			if (dirty & /*projects*/ 1) projectcard_changes.desc = /*p*/ ctx[1].project.description;
    			projectcard.$set(projectcard_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(projectcard.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(projectcard.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(projectcard, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(26:0) {#each projects as p}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let h1;
    	let t1;
    	let div;
    	let linkbutton;
    	let t2;
    	let each_1_anchor;
    	let current;

    	linkbutton = new LinkButton({
    			props: {
    				name: "New Project",
    				href: "#/project-edit"
    			},
    			$$inline: true
    		});

    	let each_value = /*projects*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Your projects";
    			t1 = space();
    			div = element("div");
    			create_component(linkbutton.$$.fragment);
    			t2 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			attr_dev(h1, "class", "text-2xl mb-2");
    			add_location(h1, file$5, 21, 0, 534);
    			attr_dev(div, "class", "w-full flex justify-end py-2");
    			add_location(div, file$5, 22, 0, 579);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    			mount_component(linkbutton, div, null);
    			insert_dev(target, t2, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*projects*/ 1) {
    				each_value = /*projects*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(linkbutton.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(linkbutton.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    			destroy_component(linkbutton);
    			if (detaching) detach_dev(t2);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ProjectList", slots, []);
    	let projects = [];

    	onMount(async () => {
    		//projects = await performRequest();
    		const api = new Api();

    		$$invalidate(0, projects = await api.getProjects() || []);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ProjectList> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		Api,
    		ProjectCard,
    		LinkButton,
    		projects
    	});

    	$$self.$inject_state = $$props => {
    		if ("projects" in $$props) $$invalidate(0, projects = $$props.projects);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [projects];
    }

    class ProjectList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ProjectList",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /**
     * @typedef {Object} WrappedComponent Object returned by the `wrap` method
     * @property {SvelteComponent} component - Component to load (this is always asynchronous)
     * @property {RoutePrecondition[]} [conditions] - Route pre-conditions to validate
     * @property {Object} [props] - Optional dictionary of static props
     * @property {Object} [userData] - Optional user data dictionary
     * @property {bool} _sveltesparouter - Internal flag; always set to true
     */

    /**
     * @callback AsyncSvelteComponent
     * @returns {Promise<SvelteComponent>} Returns a Promise that resolves with a Svelte component
     */

    /**
     * @callback RoutePrecondition
     * @param {RouteDetail} detail - Route detail object
     * @returns {boolean|Promise<boolean>} If the callback returns a false-y value, it's interpreted as the precondition failed, so it aborts loading the component (and won't process other pre-condition callbacks)
     */

    /**
     * @typedef {Object} WrapOptions Options object for the call to `wrap`
     * @property {SvelteComponent} [component] - Svelte component to load (this is incompatible with `asyncComponent`)
     * @property {AsyncSvelteComponent} [asyncComponent] - Function that returns a Promise that fulfills with a Svelte component (e.g. `{asyncComponent: () => import('Foo.svelte')}`)
     * @property {SvelteComponent} [loadingComponent] - Svelte component to be displayed while the async route is loading (as a placeholder); when unset or false-y, no component is shown while component
     * @property {object} [loadingParams] - Optional dictionary passed to the `loadingComponent` component as params (for an exported prop called `params`)
     * @property {object} [userData] - Optional object that will be passed to events such as `routeLoading`, `routeLoaded`, `conditionsFailed`
     * @property {object} [props] - Optional key-value dictionary of static props that will be passed to the component. The props are expanded with {...props}, so the key in the dictionary becomes the name of the prop.
     * @property {RoutePrecondition[]|RoutePrecondition} [conditions] - Route pre-conditions to add, which will be executed in order
     */

    /**
     * Wraps a component to enable multiple capabilities:
     * 1. Using dynamically-imported component, with (e.g. `{asyncComponent: () => import('Foo.svelte')}`), which also allows bundlers to do code-splitting.
     * 2. Adding route pre-conditions (e.g. `{conditions: [...]}`)
     * 3. Adding static props that are passed to the component
     * 4. Adding custom userData, which is passed to route events (e.g. route loaded events) or to route pre-conditions (e.g. `{userData: {foo: 'bar}}`)
     * 
     * @param {WrapOptions} args - Arguments object
     * @returns {WrappedComponent} Wrapped component
     */
    function wrap(args) {
        if (!args) {
            throw Error('Parameter args is required')
        }

        // We need to have one and only one of component and asyncComponent
        // This does a "XNOR"
        if (!args.component == !args.asyncComponent) {
            throw Error('One and only one of component and asyncComponent is required')
        }

        // If the component is not async, wrap it into a function returning a Promise
        if (args.component) {
            args.asyncComponent = () => Promise.resolve(args.component);
        }

        // Parameter asyncComponent and each item of conditions must be functions
        if (typeof args.asyncComponent != 'function') {
            throw Error('Parameter asyncComponent must be a function')
        }
        if (args.conditions) {
            // Ensure it's an array
            if (!Array.isArray(args.conditions)) {
                args.conditions = [args.conditions];
            }
            for (let i = 0; i < args.conditions.length; i++) {
                if (!args.conditions[i] || typeof args.conditions[i] != 'function') {
                    throw Error('Invalid parameter conditions[' + i + ']')
                }
            }
        }

        // Check if we have a placeholder component
        if (args.loadingComponent) {
            args.asyncComponent.loading = args.loadingComponent;
            args.asyncComponent.loadingParams = args.loadingParams || undefined;
        }

        // Returns an object that contains all the functions to execute too
        // The _sveltesparouter flag is to confirm the object was created by this router
        const obj = {
            component: args.asyncComponent,
            userData: args.userData,
            conditions: (args.conditions && args.conditions.length) ? args.conditions : undefined,
            props: (args.props && Object.keys(args.props).length) ? args.props : {},
            _sveltesparouter: true
        };

        return obj
    }

    function regexparam (str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules/svelte-spa-router/Router.svelte generated by Svelte v3.29.7 */

    const { Error: Error_1$1, Object: Object_1, console: console_1 } = globals;

    // (209:0) {:else}
    function create_else_block(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*props*/ 4)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*props*/ ctx[2])])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(209:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (202:0) {#if componentParams}
    function create_if_block$1(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [{ params: /*componentParams*/ ctx[1] }, /*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*componentParams, props*/ 6)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*componentParams*/ 2 && { params: /*componentParams*/ ctx[1] },
    					dirty & /*props*/ 4 && get_spread_object(/*props*/ ctx[2])
    				])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(202:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*componentParams*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1$1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function wrap$1(component, userData, ...conditions) {
    	// Use the new wrap method and show a deprecation warning
    	// eslint-disable-next-line no-console
    	console.warn("Method `wrap` from `svelte-spa-router` is deprecated and will be removed in a future version. Please use `svelte-spa-router/wrap` instead. See http://bit.ly/svelte-spa-router-upgrading");

    	return wrap({ component, userData, conditions });
    }

    /**
     * @typedef {Object} Location
     * @property {string} location - Location (page/view), for example `/book`
     * @property {string} [querystring] - Querystring from the hash, as a string not parsed
     */
    /**
     * Returns the current location from the hash.
     *
     * @returns {Location} Location object
     * @private
     */
    function getLocation() {
    	const hashPosition = window.location.href.indexOf("#/");

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: "/";

    	// Check if there's a querystring
    	const qsPosition = location.indexOf("?");

    	let querystring = "";

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(null, // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
    	set(getLocation());

    	const update = () => {
    		set(getLocation());
    	};

    	window.addEventListener("hashchange", update, false);

    	return function stop() {
    		window.removeEventListener("hashchange", update, false);
    	};
    });

    const location$1 = derived(loc, $loc => $loc.location);
    const querystring = derived(loc, $loc => $loc.querystring);

    async function push(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	// Note: this will include scroll state in history even when restoreScrollState is false
    	history.replaceState(
    		{
    			scrollX: window.scrollX,
    			scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	window.location.hash = (location.charAt(0) == "#" ? "" : "#") + location;
    }

    async function pop() {
    	// Execute this code when the current call stack is complete
    	await tick();

    	window.history.back();
    }

    async function replace(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	const dest = (location.charAt(0) == "#" ? "" : "#") + location;

    	try {
    		window.history.replaceState(undefined, undefined, dest);
    	} catch(e) {
    		// eslint-disable-next-line no-console
    		console.warn("Caught exception while replacing the current page. If you're running this in the Svelte REPL, please note that the `replace` method might not work in this environment.");
    	}

    	// The method above doesn't trigger the hashchange event, so let's do that manually
    	window.dispatchEvent(new Event("hashchange"));
    }

    function link(node, hrefVar) {
    	// Only apply to <a> tags
    	if (!node || !node.tagName || node.tagName.toLowerCase() != "a") {
    		throw Error("Action \"link\" can only be used with <a> tags");
    	}

    	updateLink(node, hrefVar || node.getAttribute("href"));

    	return {
    		update(updated) {
    			updateLink(node, updated);
    		}
    	};
    }

    // Internal function used by the link function
    function updateLink(node, href) {
    	// Destination must start with '/'
    	if (!href || href.length < 1 || href.charAt(0) != "/") {
    		throw Error("Invalid value for \"href\" attribute: " + href);
    	}

    	// Add # to the href attribute
    	node.setAttribute("href", "#" + href);

    	node.addEventListener("click", scrollstateHistoryHandler);
    }

    /**
     * The handler attached to an anchor tag responsible for updating the
     * current history state with the current scroll state
     *
     * @param {HTMLElementEventMap} event - an onclick event attached to an anchor tag
     */
    function scrollstateHistoryHandler(event) {
    	// Prevent default anchor onclick behaviour
    	event.preventDefault();

    	const href = event.currentTarget.getAttribute("href");

    	// Setting the url (3rd arg) to href will break clicking for reasons, so don't try to do that
    	history.replaceState(
    		{
    			scrollX: window.scrollX,
    			scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	// This will force an update as desired, but this time our scroll state will be attached
    	window.location.hash = href;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Router", slots, []);
    	let { routes = {} } = $$props;
    	let { prefix = "" } = $$props;
    	let { restoreScrollState = false } = $$props;

    	/**
     * Container for a route: path, component
     */
    	class RouteItem {
    		/**
     * Initializes the object and creates a regular expression from the path, using regexparam.
     *
     * @param {string} path - Path to the route (must start with '/' or '*')
     * @param {SvelteComponent|WrappedComponent} component - Svelte component for the route, optionally wrapped
     */
    		constructor(path, component) {
    			if (!component || typeof component != "function" && (typeof component != "object" || component._sveltesparouter !== true)) {
    				throw Error("Invalid component object");
    			}

    			// Path must be a regular or expression, or a string starting with '/' or '*'
    			if (!path || typeof path == "string" && (path.length < 1 || path.charAt(0) != "/" && path.charAt(0) != "*") || typeof path == "object" && !(path instanceof RegExp)) {
    				throw Error("Invalid value for \"path\" argument");
    			}

    			const { pattern, keys } = regexparam(path);
    			this.path = path;

    			// Check if the component is wrapped and we have conditions
    			if (typeof component == "object" && component._sveltesparouter === true) {
    				this.component = component.component;
    				this.conditions = component.conditions || [];
    				this.userData = component.userData;
    				this.props = component.props || {};
    			} else {
    				// Convert the component to a function that returns a Promise, to normalize it
    				this.component = () => Promise.resolve(component);

    				this.conditions = [];
    				this.props = {};
    			}

    			this._pattern = pattern;
    			this._keys = keys;
    		}

    		/**
     * Checks if `path` matches the current route.
     * If there's a match, will return the list of parameters from the URL (if any).
     * In case of no match, the method will return `null`.
     *
     * @param {string} path - Path to test
     * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
     */
    		match(path) {
    			// If there's a prefix, remove it before we run the matching
    			if (prefix) {
    				if (typeof prefix == "string" && path.startsWith(prefix)) {
    					path = path.substr(prefix.length) || "/";
    				} else if (prefix instanceof RegExp) {
    					const match = path.match(prefix);

    					if (match && match[0]) {
    						path = path.substr(match[0].length) || "/";
    					}
    				}
    			}

    			// Check if the pattern matches
    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			// If the input was a regular expression, this._keys would be false, so return matches as is
    			if (this._keys === false) {
    				return matches;
    			}

    			const out = {};
    			let i = 0;

    			while (i < this._keys.length) {
    				// In the match parameters, URL-decode all values
    				try {
    					out[this._keys[i]] = decodeURIComponent(matches[i + 1] || "") || null;
    				} catch(e) {
    					out[this._keys[i]] = null;
    				}

    				i++;
    			}

    			return out;
    		}

    		/**
     * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoading`, `routeLoaded` and `conditionsFailed` events
     * @typedef {Object} RouteDetail
     * @property {string|RegExp} route - Route matched as defined in the route definition (could be a string or a reguar expression object)
     * @property {string} location - Location path
     * @property {string} querystring - Querystring from the hash
     * @property {object} [userData] - Custom data passed by the user
     * @property {SvelteComponent} [component] - Svelte component (only in `routeLoaded` events)
     * @property {string} [name] - Name of the Svelte component (only in `routeLoaded` events)
     */
    		/**
     * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
     * 
     * @param {RouteDetail} detail - Route detail
     * @returns {bool} Returns true if all the conditions succeeded
     */
    		async checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!await this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	// Set up all routes
    	const routesList = [];

    	if (routes instanceof Map) {
    		// If it's a map, iterate on it right away
    		routes.forEach((route, path) => {
    			routesList.push(new RouteItem(path, route));
    		});
    	} else {
    		// We have an object, so iterate on its own properties
    		Object.keys(routes).forEach(path => {
    			routesList.push(new RouteItem(path, routes[path]));
    		});
    	}

    	// Props for the component to render
    	let component = null;

    	let componentParams = null;
    	let props = {};

    	// Event dispatcher from Svelte
    	const dispatch = createEventDispatcher();

    	// Just like dispatch, but executes on the next iteration of the event loop
    	async function dispatchNextTick(name, detail) {
    		// Execute this code when the current call stack is complete
    		await tick();

    		dispatch(name, detail);
    	}

    	// If this is set, then that means we have popped into this var the state of our last scroll position
    	let previousScrollState = null;

    	if (restoreScrollState) {
    		window.addEventListener("popstate", event => {
    			// If this event was from our history.replaceState, event.state will contain
    			// our scroll history. Otherwise, event.state will be null (like on forward
    			// navigation)
    			if (event.state && event.state.scrollY) {
    				previousScrollState = event.state;
    			} else {
    				previousScrollState = null;
    			}
    		});

    		afterUpdate(() => {
    			// If this exists, then this is a back navigation: restore the scroll position
    			if (previousScrollState) {
    				window.scrollTo(previousScrollState.scrollX, previousScrollState.scrollY);
    			} else {
    				// Otherwise this is a forward navigation: scroll to top
    				window.scrollTo(0, 0);
    			}
    		});
    	}

    	// Always have the latest value of loc
    	let lastLoc = null;

    	// Current object of the component loaded
    	let componentObj = null;

    	// Handle hash change events
    	// Listen to changes in the $loc store and update the page
    	// Do not use the $: syntax because it gets triggered by too many things
    	loc.subscribe(async newLoc => {
    		lastLoc = newLoc;

    		// Find a route matching the location
    		let i = 0;

    		while (i < routesList.length) {
    			const match = routesList[i].match(newLoc.location);

    			if (!match) {
    				i++;
    				continue;
    			}

    			const detail = {
    				route: routesList[i].path,
    				location: newLoc.location,
    				querystring: newLoc.querystring,
    				userData: routesList[i].userData
    			};

    			// Check if the route can be loaded - if all conditions succeed
    			if (!await routesList[i].checkConditions(detail)) {
    				// Don't display anything
    				$$invalidate(0, component = null);

    				componentObj = null;

    				// Trigger an event to notify the user, then exit
    				dispatchNextTick("conditionsFailed", detail);

    				return;
    			}

    			// Trigger an event to alert that we're loading the route
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick("routeLoading", Object.assign({}, detail));

    			// If there's a component to show while we're loading the route, display it
    			const obj = routesList[i].component;

    			// Do not replace the component if we're loading the same one as before, to avoid the route being unmounted and re-mounted
    			if (componentObj != obj) {
    				if (obj.loading) {
    					$$invalidate(0, component = obj.loading);
    					componentObj = obj;
    					$$invalidate(1, componentParams = obj.loadingParams);
    					$$invalidate(2, props = {});

    					// Trigger the routeLoaded event for the loading component
    					// Create a copy of detail so we don't modify the object for the dynamic route (and the dynamic route doesn't modify our object too)
    					dispatchNextTick("routeLoaded", Object.assign({}, detail, { component, name: component.name }));
    				} else {
    					$$invalidate(0, component = null);
    					componentObj = null;
    				}

    				// Invoke the Promise
    				const loaded = await obj();

    				// Now that we're here, after the promise resolved, check if we still want this component, as the user might have navigated to another page in the meanwhile
    				if (newLoc != lastLoc) {
    					// Don't update the component, just exit
    					return;
    				}

    				// If there is a "default" property, which is used by async routes, then pick that
    				$$invalidate(0, component = loaded && loaded.default || loaded);

    				componentObj = obj;
    			}

    			// Set componentParams only if we have a match, to avoid a warning similar to `<Component> was created with unknown prop 'params'`
    			// Of course, this assumes that developers always add a "params" prop when they are expecting parameters
    			if (match && typeof match == "object" && Object.keys(match).length) {
    				$$invalidate(1, componentParams = match);
    			} else {
    				$$invalidate(1, componentParams = null);
    			}

    			// Set static props, if any
    			$$invalidate(2, props = routesList[i].props);

    			// Dispatch the routeLoaded event then exit
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick("routeLoaded", Object.assign({}, detail, { component, name: component.name }));

    			return;
    		}

    		// If we're still here, there was no match, so show the empty component
    		$$invalidate(0, component = null);

    		componentObj = null;
    	});

    	const writable_props = ["routes", "prefix", "restoreScrollState"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	function routeEvent_handler(event) {
    		bubble($$self, event);
    	}

    	function routeEvent_handler_1(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("routes" in $$props) $$invalidate(3, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ("restoreScrollState" in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    	};

    	$$self.$capture_state = () => ({
    		readable,
    		derived,
    		tick,
    		_wrap: wrap,
    		wrap: wrap$1,
    		getLocation,
    		loc,
    		location: location$1,
    		querystring,
    		push,
    		pop,
    		replace,
    		link,
    		updateLink,
    		scrollstateHistoryHandler,
    		createEventDispatcher,
    		afterUpdate,
    		regexparam,
    		routes,
    		prefix,
    		restoreScrollState,
    		RouteItem,
    		routesList,
    		component,
    		componentParams,
    		props,
    		dispatch,
    		dispatchNextTick,
    		previousScrollState,
    		lastLoc,
    		componentObj
    	});

    	$$self.$inject_state = $$props => {
    		if ("routes" in $$props) $$invalidate(3, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ("restoreScrollState" in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    		if ("component" in $$props) $$invalidate(0, component = $$props.component);
    		if ("componentParams" in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    		if ("props" in $$props) $$invalidate(2, props = $$props.props);
    		if ("previousScrollState" in $$props) previousScrollState = $$props.previousScrollState;
    		if ("lastLoc" in $$props) lastLoc = $$props.lastLoc;
    		if ("componentObj" in $$props) componentObj = $$props.componentObj;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*restoreScrollState*/ 32) {
    			// Update history.scrollRestoration depending on restoreScrollState
    			 history.scrollRestoration = restoreScrollState ? "manual" : "auto";
    		}
    	};

    	return [
    		component,
    		componentParams,
    		props,
    		routes,
    		prefix,
    		restoreScrollState,
    		routeEvent_handler,
    		routeEvent_handler_1
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {
    			routes: 3,
    			prefix: 4,
    			restoreScrollState: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get routes() {
    		throw new Error_1$1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1$1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1$1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1$1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get restoreScrollState() {
    		throw new Error_1$1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set restoreScrollState(value) {
    		throw new Error_1$1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/routes/Login.svelte generated by Svelte v3.29.7 */
    const file$6 = "src/routes/Login.svelte";

    // (26:4) {#if errorMsg}
    function create_if_block$2(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*errorMsg*/ ctx[0]);
    			attr_dev(div, "class", "bg-red-500 mt-8");
    			add_location(div, file$6, 26, 8, 793);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*errorMsg*/ 1) set_data_dev(t, /*errorMsg*/ ctx[0]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(26:4) {#if errorMsg}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let div3;
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let t2;
    	let div2;
    	let linkbutton;
    	let t3;
    	let current;

    	linkbutton = new LinkButton({
    			props: { name: "Login", href: "#" },
    			$$inline: true
    		});

    	linkbutton.$on("click", /*doLogin*/ ctx[1]);
    	let if_block = /*errorMsg*/ ctx[0] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			div0.textContent = "Simple general purpose issue tracker";
    			t2 = space();
    			div2 = element("div");
    			create_component(linkbutton.$$.fragment);
    			t3 = space();
    			if (if_block) if_block.c();
    			if (img.src !== (img_src_value = "/img/logo_1_inv.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file$6, 17, 8, 499);
    			attr_dev(div0, "class", "text-white mt-8 flex justify-end");
    			add_location(div0, file$6, 18, 8, 546);
    			attr_dev(div1, "class", "mt-8 p-6 lg:w-1/2 sm:w-3/4 bg-green-500 flex flex-col");
    			add_location(div1, file$6, 16, 4, 423);
    			attr_dev(div2, "class", "mt-16");
    			add_location(div2, file$6, 22, 4, 672);
    			attr_dev(div3, "class", "container mx-auto flex flex-col items-center pt-16");
    			add_location(div3, file$6, 15, 0, 354);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div1);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			mount_component(linkbutton, div2, null);
    			append_dev(div3, t3);
    			if (if_block) if_block.m(div3, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*errorMsg*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(div3, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(linkbutton.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(linkbutton.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_component(linkbutton);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Login", slots, []);
    	let errorMsg;

    	function doLogin() {
    		$$invalidate(0, errorMsg = undefined);
    		login().catch(e => $$invalidate(0, errorMsg = e.message));
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Login> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		push,
    		login,
    		isAuthenticated,
    		onMount,
    		LinkButton,
    		errorMsg,
    		doLogin
    	});

    	$$self.$inject_state = $$props => {
    		if ("errorMsg" in $$props) $$invalidate(0, errorMsg = $$props.errorMsg);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [errorMsg, doLogin];
    }

    class Login extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Login",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src/c8s/Layout.svelte generated by Svelte v3.29.7 */

    function create_fragment$a(ctx) {
    	let navigation;
    	let t;
    	let current;
    	navigation = new Navigation({ $$inline: true });
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			create_component(navigation.$$.fragment);
    			t = space();
    			if (default_slot) default_slot.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(navigation, target, anchor);
    			insert_dev(target, t, anchor);

    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 1) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[0], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navigation.$$.fragment, local);
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navigation.$$.fragment, local);
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(navigation, detaching);
    			if (detaching) detach_dev(t);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Layout", slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Layout> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ Navigation });
    	return [$$scope, slots];
    }

    class Layout extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Layout",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src/routes/Tasks.svelte generated by Svelte v3.29.7 */

    const { console: console_1$1 } = globals;
    const file$7 = "src/routes/Tasks.svelte";

    // (19:0) <Layout>
    function create_default_slot(ctx) {
    	let h1;
    	let t1;
    	let div;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "tasks";
    			t1 = space();
    			div = element("div");
    			div.textContent = `projects: ${/*projects*/ ctx[0]}`;
    			add_location(h1, file$7, 19, 4, 376);
    			add_location(div, file$7, 20, 4, 395);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(19:0) <Layout>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let layout;
    	let current;

    	layout = new Layout({
    			props: {
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(layout.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(layout, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const layout_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				layout_changes.$$scope = { dirty, ctx };
    			}

    			layout.$set(layout_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(layout.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(layout.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(layout, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Tasks", slots, []);
    	let projects;

    	onMount(() => {
    		
    	}); //projects = performRequest();

    	async function performRequest() {
    		console.log(projects);
    		return projects;
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Tasks> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Layout,
    		onMount,
    		Api,
    		projects,
    		performRequest
    	});

    	$$self.$inject_state = $$props => {
    		if ("projects" in $$props) $$invalidate(0, projects = $$props.projects);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [projects];
    }

    class Tasks extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tasks",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src/routes/Projects.svelte generated by Svelte v3.29.7 */

    // (13:4) <CenteredFlex extraClasses="px-2">
    function create_default_slot_1(ctx) {
    	let projectlist;
    	let current;
    	projectlist = new ProjectList({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(projectlist.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(projectlist, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(projectlist.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(projectlist.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(projectlist, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(13:4) <CenteredFlex extraClasses=\\\"px-2\\\">",
    		ctx
    	});

    	return block;
    }

    // (12:0) <Layout>
    function create_default_slot$1(ctx) {
    	let centeredflex;
    	let current;

    	centeredflex = new CenteredFlex({
    			props: {
    				extraClasses: "px-2",
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(centeredflex.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(centeredflex, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const centeredflex_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				centeredflex_changes.$$scope = { dirty, ctx };
    			}

    			centeredflex.$set(centeredflex_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(centeredflex.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(centeredflex.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(centeredflex, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(12:0) <Layout>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let layout;
    	let current;

    	layout = new Layout({
    			props: {
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(layout.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(layout, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const layout_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				layout_changes.$$scope = { dirty, ctx };
    			}

    			layout.$set(layout_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(layout.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(layout.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(layout, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Projects", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Projects> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Layout,
    		CenteredFlex,
    		onMount,
    		Api,
    		ProjectCard,
    		OidcContext,
    		isLoading,
    		ProjectList
    	});

    	return [];
    }

    class Projects extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Projects",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    /* src/routes/Bar.svelte generated by Svelte v3.29.7 */

    const file$8 = "src/routes/Bar.svelte";

    function create_fragment$d(ctx) {
    	let div;
    	let t0;
    	let strong;
    	let t2;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text("This is ");
    			strong = element("strong");
    			strong.textContent = "Bar";
    			t2 = text(" component");
    			add_location(strong, file$8, 1, 12, 18);
    			add_location(div, file$8, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, strong);
    			append_dev(div, t2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Bar", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Bar> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Bar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Bar",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    /* src/routes/Home.svelte generated by Svelte v3.29.7 */

    const { console: console_1$2 } = globals;
    const file$9 = "src/routes/Home.svelte";

    // (22:4) <CenteredFlex>
    function create_default_slot_1$1(ctx) {
    	let div0;
    	let t1;
    	let div1;
    	let t2;
    	let a;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			div0.textContent = "Home component";
    			t1 = space();
    			div1 = element("div");
    			t2 = text("Check out your ");
    			a = element("a");
    			a.textContent = "Projects";
    			attr_dev(div0, "class", "mt-10");
    			add_location(div0, file$9, 22, 8, 565);
    			attr_dev(a, "class", "underline");
    			attr_dev(a, "href", "#/projects");
    			add_location(a, file$9, 23, 42, 647);
    			attr_dev(div1, "class", "mt-10");
    			add_location(div1, file$9, 23, 8, 613);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, t2);
    			append_dev(div1, a);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$1.name,
    		type: "slot",
    		source: "(22:4) <CenteredFlex>",
    		ctx
    	});

    	return block;
    }

    // (21:0) <Layout>
    function create_default_slot$2(ctx) {
    	let centeredflex;
    	let current;

    	centeredflex = new CenteredFlex({
    			props: {
    				$$slots: { default: [create_default_slot_1$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(centeredflex.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(centeredflex, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const centeredflex_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				centeredflex_changes.$$scope = { dirty, ctx };
    			}

    			centeredflex.$set(centeredflex_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(centeredflex.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(centeredflex.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(centeredflex, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(21:0) <Layout>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let layout;
    	let current;

    	layout = new Layout({
    			props: {
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(layout.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(layout, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const layout_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				layout_changes.$$scope = { dirty, ctx };
    			}

    			layout.$set(layout_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(layout.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(layout.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(layout, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Home", slots, []);

    	onMount(() => {
    		console.log("Home onMount");
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		push,
    		login,
    		isAuthenticated,
    		onMount,
    		LinkButton,
    		Layout,
    		CenteredFlex
    	});

    	return [];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$e.name
    		});
    	}
    }

    /* src/routes/Workspace.svelte generated by Svelte v3.29.7 */

    // (5:0) <Layout>
    function create_default_slot$3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Workspace");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(5:0) <Layout>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$f(ctx) {
    	let layout;
    	let current;

    	layout = new Layout({
    			props: {
    				$$slots: { default: [create_default_slot$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(layout.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(layout, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const layout_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				layout_changes.$$scope = { dirty, ctx };
    			}

    			layout.$set(layout_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(layout.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(layout.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(layout, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Workspace", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Workspace> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Layout });
    	return [];
    }

    class Workspace extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Workspace",
    			options,
    			id: create_fragment$f.name
    		});
    	}
    }

    var validate = createCommonjsModule(function (module, exports) {
    /*!
     * validate.js 0.13.1
     *
     * (c) 2013-2019 Nicklas Ansman, 2013 Wrapp
     * Validate.js may be freely distributed under the MIT license.
     * For all details and documentation:
     * http://validatejs.org/
     */

    (function(exports, module, define) {

      // The main function that calls the validators specified by the constraints.
      // The options are the following:
      //   - format (string) - An option that controls how the returned value is formatted
      //     * flat - Returns a flat array of just the error messages
      //     * grouped - Returns the messages grouped by attribute (default)
      //     * detailed - Returns an array of the raw validation data
      //   - fullMessages (boolean) - If `true` (default) the attribute name is prepended to the error.
      //
      // Please note that the options are also passed to each validator.
      var validate = function(attributes, constraints, options) {
        options = v.extend({}, v.options, options);

        var results = v.runValidations(attributes, constraints, options)
          ;

        if (results.some(function(r) { return v.isPromise(r.error); })) {
          throw new Error("Use validate.async if you want support for promises");
        }
        return validate.processValidationResults(results, options);
      };

      var v = validate;

      // Copies over attributes from one or more sources to a single destination.
      // Very much similar to underscore's extend.
      // The first argument is the target object and the remaining arguments will be
      // used as sources.
      v.extend = function(obj) {
        [].slice.call(arguments, 1).forEach(function(source) {
          for (var attr in source) {
            obj[attr] = source[attr];
          }
        });
        return obj;
      };

      v.extend(validate, {
        // This is the version of the library as a semver.
        // The toString function will allow it to be coerced into a string
        version: {
          major: 0,
          minor: 13,
          patch: 1,
          metadata: null,
          toString: function() {
            var version = v.format("%{major}.%{minor}.%{patch}", v.version);
            if (!v.isEmpty(v.version.metadata)) {
              version += "+" + v.version.metadata;
            }
            return version;
          }
        },

        // Below is the dependencies that are used in validate.js

        // The constructor of the Promise implementation.
        // If you are using Q.js, RSVP or any other A+ compatible implementation
        // override this attribute to be the constructor of that promise.
        // Since jQuery promises aren't A+ compatible they won't work.
        Promise: typeof Promise !== "undefined" ? Promise : /* istanbul ignore next */ null,

        EMPTY_STRING_REGEXP: /^\s*$/,

        // Runs the validators specified by the constraints object.
        // Will return an array of the format:
        //     [{attribute: "<attribute name>", error: "<validation result>"}, ...]
        runValidations: function(attributes, constraints, options) {
          var results = []
            , attr
            , validatorName
            , value
            , validators
            , validator
            , validatorOptions
            , error;

          if (v.isDomElement(attributes) || v.isJqueryElement(attributes)) {
            attributes = v.collectFormValues(attributes);
          }

          // Loops through each constraints, finds the correct validator and run it.
          for (attr in constraints) {
            value = v.getDeepObjectValue(attributes, attr);
            // This allows the constraints for an attribute to be a function.
            // The function will be called with the value, attribute name, the complete dict of
            // attributes as well as the options and constraints passed in.
            // This is useful when you want to have different
            // validations depending on the attribute value.
            validators = v.result(constraints[attr], value, attributes, attr, options, constraints);

            for (validatorName in validators) {
              validator = v.validators[validatorName];

              if (!validator) {
                error = v.format("Unknown validator %{name}", {name: validatorName});
                throw new Error(error);
              }

              validatorOptions = validators[validatorName];
              // This allows the options to be a function. The function will be
              // called with the value, attribute name, the complete dict of
              // attributes as well as the options and constraints passed in.
              // This is useful when you want to have different
              // validations depending on the attribute value.
              validatorOptions = v.result(validatorOptions, value, attributes, attr, options, constraints);
              if (!validatorOptions) {
                continue;
              }
              results.push({
                attribute: attr,
                value: value,
                validator: validatorName,
                globalOptions: options,
                attributes: attributes,
                options: validatorOptions,
                error: validator.call(validator,
                    value,
                    validatorOptions,
                    attr,
                    attributes,
                    options)
              });
            }
          }

          return results;
        },

        // Takes the output from runValidations and converts it to the correct
        // output format.
        processValidationResults: function(errors, options) {
          errors = v.pruneEmptyErrors(errors, options);
          errors = v.expandMultipleErrors(errors, options);
          errors = v.convertErrorMessages(errors, options);

          var format = options.format || "grouped";

          if (typeof v.formatters[format] === 'function') {
            errors = v.formatters[format](errors);
          } else {
            throw new Error(v.format("Unknown format %{format}", options));
          }

          return v.isEmpty(errors) ? undefined : errors;
        },

        // Runs the validations with support for promises.
        // This function will return a promise that is settled when all the
        // validation promises have been completed.
        // It can be called even if no validations returned a promise.
        async: function(attributes, constraints, options) {
          options = v.extend({}, v.async.options, options);

          var WrapErrors = options.wrapErrors || function(errors) {
            return errors;
          };

          // Removes unknown attributes
          if (options.cleanAttributes !== false) {
            attributes = v.cleanAttributes(attributes, constraints);
          }

          var results = v.runValidations(attributes, constraints, options);

          return new v.Promise(function(resolve, reject) {
            v.waitForResults(results).then(function() {
              var errors = v.processValidationResults(results, options);
              if (errors) {
                reject(new WrapErrors(errors, options, attributes, constraints));
              } else {
                resolve(attributes);
              }
            }, function(err) {
              reject(err);
            });
          });
        },

        single: function(value, constraints, options) {
          options = v.extend({}, v.single.options, options, {
            format: "flat",
            fullMessages: false
          });
          return v({single: value}, {single: constraints}, options);
        },

        // Returns a promise that is resolved when all promises in the results array
        // are settled. The promise returned from this function is always resolved,
        // never rejected.
        // This function modifies the input argument, it replaces the promises
        // with the value returned from the promise.
        waitForResults: function(results) {
          // Create a sequence of all the results starting with a resolved promise.
          return results.reduce(function(memo, result) {
            // If this result isn't a promise skip it in the sequence.
            if (!v.isPromise(result.error)) {
              return memo;
            }

            return memo.then(function() {
              return result.error.then(function(error) {
                result.error = error || null;
              });
            });
          }, new v.Promise(function(r) { r(); })); // A resolved promise
        },

        // If the given argument is a call: function the and: function return the value
        // otherwise just return the value. Additional arguments will be passed as
        // arguments to the function.
        // Example:
        // ```
        // result('foo') // 'foo'
        // result(Math.max, 1, 2) // 2
        // ```
        result: function(value) {
          var args = [].slice.call(arguments, 1);
          if (typeof value === 'function') {
            value = value.apply(null, args);
          }
          return value;
        },

        // Checks if the value is a number. This function does not consider NaN a
        // number like many other `isNumber` functions do.
        isNumber: function(value) {
          return typeof value === 'number' && !isNaN(value);
        },

        // Returns false if the object is not a function
        isFunction: function(value) {
          return typeof value === 'function';
        },

        // A simple check to verify that the value is an integer. Uses `isNumber`
        // and a simple modulo check.
        isInteger: function(value) {
          return v.isNumber(value) && value % 1 === 0;
        },

        // Checks if the value is a boolean
        isBoolean: function(value) {
          return typeof value === 'boolean';
        },

        // Uses the `Object` function to check if the given argument is an object.
        isObject: function(obj) {
          return obj === Object(obj);
        },

        // Simply checks if the object is an instance of a date
        isDate: function(obj) {
          return obj instanceof Date;
        },

        // Returns false if the object is `null` of `undefined`
        isDefined: function(obj) {
          return obj !== null && obj !== undefined;
        },

        // Checks if the given argument is a promise. Anything with a `then`
        // function is considered a promise.
        isPromise: function(p) {
          return !!p && v.isFunction(p.then);
        },

        isJqueryElement: function(o) {
          return o && v.isString(o.jquery);
        },

        isDomElement: function(o) {
          if (!o) {
            return false;
          }

          if (!o.querySelectorAll || !o.querySelector) {
            return false;
          }

          if (v.isObject(document) && o === document) {
            return true;
          }

          // http://stackoverflow.com/a/384380/699304
          /* istanbul ignore else */
          if (typeof HTMLElement === "object") {
            return o instanceof HTMLElement;
          } else {
            return o &&
              typeof o === "object" &&
              o !== null &&
              o.nodeType === 1 &&
              typeof o.nodeName === "string";
          }
        },

        isEmpty: function(value) {
          var attr;

          // Null and undefined are empty
          if (!v.isDefined(value)) {
            return true;
          }

          // functions are non empty
          if (v.isFunction(value)) {
            return false;
          }

          // Whitespace only strings are empty
          if (v.isString(value)) {
            return v.EMPTY_STRING_REGEXP.test(value);
          }

          // For arrays we use the length property
          if (v.isArray(value)) {
            return value.length === 0;
          }

          // Dates have no attributes but aren't empty
          if (v.isDate(value)) {
            return false;
          }

          // If we find at least one property we consider it non empty
          if (v.isObject(value)) {
            for (attr in value) {
              return false;
            }
            return true;
          }

          return false;
        },

        // Formats the specified strings with the given values like so:
        // ```
        // format("Foo: %{foo}", {foo: "bar"}) // "Foo bar"
        // ```
        // If you want to write %{...} without having it replaced simply
        // prefix it with % like this `Foo: %%{foo}` and it will be returned
        // as `"Foo: %{foo}"`
        format: v.extend(function(str, vals) {
          if (!v.isString(str)) {
            return str;
          }
          return str.replace(v.format.FORMAT_REGEXP, function(m0, m1, m2) {
            if (m1 === '%') {
              return "%{" + m2 + "}";
            } else {
              return String(vals[m2]);
            }
          });
        }, {
          // Finds %{key} style patterns in the given string
          FORMAT_REGEXP: /(%?)%\{([^\}]+)\}/g
        }),

        // "Prettifies" the given string.
        // Prettifying means replacing [.\_-] with spaces as well as splitting
        // camel case words.
        prettify: function(str) {
          if (v.isNumber(str)) {
            // If there are more than 2 decimals round it to two
            if ((str * 100) % 1 === 0) {
              return "" + str;
            } else {
              return parseFloat(Math.round(str * 100) / 100).toFixed(2);
            }
          }

          if (v.isArray(str)) {
            return str.map(function(s) { return v.prettify(s); }).join(", ");
          }

          if (v.isObject(str)) {
            if (!v.isDefined(str.toString)) {
              return JSON.stringify(str);
            }

            return str.toString();
          }

          // Ensure the string is actually a string
          str = "" + str;

          return str
            // Splits keys separated by periods
            .replace(/([^\s])\.([^\s])/g, '$1 $2')
            // Removes backslashes
            .replace(/\\+/g, '')
            // Replaces - and - with space
            .replace(/[_-]/g, ' ')
            // Splits camel cased words
            .replace(/([a-z])([A-Z])/g, function(m0, m1, m2) {
              return "" + m1 + " " + m2.toLowerCase();
            })
            .toLowerCase();
        },

        stringifyValue: function(value, options) {
          var prettify = options && options.prettify || v.prettify;
          return prettify(value);
        },

        isString: function(value) {
          return typeof value === 'string';
        },

        isArray: function(value) {
          return {}.toString.call(value) === '[object Array]';
        },

        // Checks if the object is a hash, which is equivalent to an object that
        // is neither an array nor a function.
        isHash: function(value) {
          return v.isObject(value) && !v.isArray(value) && !v.isFunction(value);
        },

        contains: function(obj, value) {
          if (!v.isDefined(obj)) {
            return false;
          }
          if (v.isArray(obj)) {
            return obj.indexOf(value) !== -1;
          }
          return value in obj;
        },

        unique: function(array) {
          if (!v.isArray(array)) {
            return array;
          }
          return array.filter(function(el, index, array) {
            return array.indexOf(el) == index;
          });
        },

        forEachKeyInKeypath: function(object, keypath, callback) {
          if (!v.isString(keypath)) {
            return undefined;
          }

          var key = ""
            , i
            , escape = false;

          for (i = 0; i < keypath.length; ++i) {
            switch (keypath[i]) {
              case '.':
                if (escape) {
                  escape = false;
                  key += '.';
                } else {
                  object = callback(object, key, false);
                  key = "";
                }
                break;

              case '\\':
                if (escape) {
                  escape = false;
                  key += '\\';
                } else {
                  escape = true;
                }
                break;

              default:
                escape = false;
                key += keypath[i];
                break;
            }
          }

          return callback(object, key, true);
        },

        getDeepObjectValue: function(obj, keypath) {
          if (!v.isObject(obj)) {
            return undefined;
          }

          return v.forEachKeyInKeypath(obj, keypath, function(obj, key) {
            if (v.isObject(obj)) {
              return obj[key];
            }
          });
        },

        // This returns an object with all the values of the form.
        // It uses the input name as key and the value as value
        // So for example this:
        // <input type="text" name="email" value="foo@bar.com" />
        // would return:
        // {email: "foo@bar.com"}
        collectFormValues: function(form, options) {
          var values = {}
            , i
            , j
            , input
            , inputs
            , option
            , value;

          if (v.isJqueryElement(form)) {
            form = form[0];
          }

          if (!form) {
            return values;
          }

          options = options || {};

          inputs = form.querySelectorAll("input[name], textarea[name]");
          for (i = 0; i < inputs.length; ++i) {
            input = inputs.item(i);

            if (v.isDefined(input.getAttribute("data-ignored"))) {
              continue;
            }

            var name = input.name.replace(/\./g, "\\\\.");
            value = v.sanitizeFormValue(input.value, options);
            if (input.type === "number") {
              value = value ? +value : null;
            } else if (input.type === "checkbox") {
              if (input.attributes.value) {
                if (!input.checked) {
                  value = values[name] || null;
                }
              } else {
                value = input.checked;
              }
            } else if (input.type === "radio") {
              if (!input.checked) {
                value = values[name] || null;
              }
            }
            values[name] = value;
          }

          inputs = form.querySelectorAll("select[name]");
          for (i = 0; i < inputs.length; ++i) {
            input = inputs.item(i);
            if (v.isDefined(input.getAttribute("data-ignored"))) {
              continue;
            }

            if (input.multiple) {
              value = [];
              for (j in input.options) {
                option = input.options[j];
                 if (option && option.selected) {
                  value.push(v.sanitizeFormValue(option.value, options));
                }
              }
            } else {
              var _val = typeof input.options[input.selectedIndex] !== 'undefined' ? input.options[input.selectedIndex].value : /* istanbul ignore next */ '';
              value = v.sanitizeFormValue(_val, options);
            }
            values[input.name] = value;
          }

          return values;
        },

        sanitizeFormValue: function(value, options) {
          if (options.trim && v.isString(value)) {
            value = value.trim();
          }

          if (options.nullify !== false && value === "") {
            return null;
          }
          return value;
        },

        capitalize: function(str) {
          if (!v.isString(str)) {
            return str;
          }
          return str[0].toUpperCase() + str.slice(1);
        },

        // Remove all errors who's error attribute is empty (null or undefined)
        pruneEmptyErrors: function(errors) {
          return errors.filter(function(error) {
            return !v.isEmpty(error.error);
          });
        },

        // In
        // [{error: ["err1", "err2"], ...}]
        // Out
        // [{error: "err1", ...}, {error: "err2", ...}]
        //
        // All attributes in an error with multiple messages are duplicated
        // when expanding the errors.
        expandMultipleErrors: function(errors) {
          var ret = [];
          errors.forEach(function(error) {
            // Removes errors without a message
            if (v.isArray(error.error)) {
              error.error.forEach(function(msg) {
                ret.push(v.extend({}, error, {error: msg}));
              });
            } else {
              ret.push(error);
            }
          });
          return ret;
        },

        // Converts the error mesages by prepending the attribute name unless the
        // message is prefixed by ^
        convertErrorMessages: function(errors, options) {
          options = options || {};

          var ret = []
            , prettify = options.prettify || v.prettify;
          errors.forEach(function(errorInfo) {
            var error = v.result(errorInfo.error,
                errorInfo.value,
                errorInfo.attribute,
                errorInfo.options,
                errorInfo.attributes,
                errorInfo.globalOptions);

            if (!v.isString(error)) {
              ret.push(errorInfo);
              return;
            }

            if (error[0] === '^') {
              error = error.slice(1);
            } else if (options.fullMessages !== false) {
              error = v.capitalize(prettify(errorInfo.attribute)) + " " + error;
            }
            error = error.replace(/\\\^/g, "^");
            error = v.format(error, {
              value: v.stringifyValue(errorInfo.value, options)
            });
            ret.push(v.extend({}, errorInfo, {error: error}));
          });
          return ret;
        },

        // In:
        // [{attribute: "<attributeName>", ...}]
        // Out:
        // {"<attributeName>": [{attribute: "<attributeName>", ...}]}
        groupErrorsByAttribute: function(errors) {
          var ret = {};
          errors.forEach(function(error) {
            var list = ret[error.attribute];
            if (list) {
              list.push(error);
            } else {
              ret[error.attribute] = [error];
            }
          });
          return ret;
        },

        // In:
        // [{error: "<message 1>", ...}, {error: "<message 2>", ...}]
        // Out:
        // ["<message 1>", "<message 2>"]
        flattenErrorsToArray: function(errors) {
          return errors
            .map(function(error) { return error.error; })
            .filter(function(value, index, self) {
              return self.indexOf(value) === index;
            });
        },

        cleanAttributes: function(attributes, whitelist) {
          function whitelistCreator(obj, key, last) {
            if (v.isObject(obj[key])) {
              return obj[key];
            }
            return (obj[key] = last ? true : {});
          }

          function buildObjectWhitelist(whitelist) {
            var ow = {}
              , attr;
            for (attr in whitelist) {
              if (!whitelist[attr]) {
                continue;
              }
              v.forEachKeyInKeypath(ow, attr, whitelistCreator);
            }
            return ow;
          }

          function cleanRecursive(attributes, whitelist) {
            if (!v.isObject(attributes)) {
              return attributes;
            }

            var ret = v.extend({}, attributes)
              , w
              , attribute;

            for (attribute in attributes) {
              w = whitelist[attribute];

              if (v.isObject(w)) {
                ret[attribute] = cleanRecursive(ret[attribute], w);
              } else if (!w) {
                delete ret[attribute];
              }
            }
            return ret;
          }

          if (!v.isObject(whitelist) || !v.isObject(attributes)) {
            return {};
          }

          whitelist = buildObjectWhitelist(whitelist);
          return cleanRecursive(attributes, whitelist);
        },

        exposeModule: function(validate, root, exports, module, define) {
          if (exports) {
            if (module && module.exports) {
              exports = module.exports = validate;
            }
            exports.validate = validate;
          } else {
            root.validate = validate;
            if (validate.isFunction(define) && define.amd) {
              define([], function () { return validate; });
            }
          }
        },

        warn: function(msg) {
          if (typeof console !== "undefined" && console.warn) {
            console.warn("[validate.js] " + msg);
          }
        },

        error: function(msg) {
          if (typeof console !== "undefined" && console.error) {
            console.error("[validate.js] " + msg);
          }
        }
      });

      validate.validators = {
        // Presence validates that the value isn't empty
        presence: function(value, options) {
          options = v.extend({}, this.options, options);
          if (options.allowEmpty !== false ? !v.isDefined(value) : v.isEmpty(value)) {
            return options.message || this.message || "can't be blank";
          }
        },
        length: function(value, options, attribute) {
          // Empty values are allowed
          if (!v.isDefined(value)) {
            return;
          }

          options = v.extend({}, this.options, options);

          var is = options.is
            , maximum = options.maximum
            , minimum = options.minimum
            , tokenizer = options.tokenizer || function(val) { return val; }
            , err
            , errors = [];

          value = tokenizer(value);
          var length = value.length;
          if(!v.isNumber(length)) {
            return options.message || this.notValid || "has an incorrect length";
          }

          // Is checks
          if (v.isNumber(is) && length !== is) {
            err = options.wrongLength ||
              this.wrongLength ||
              "is the wrong length (should be %{count} characters)";
            errors.push(v.format(err, {count: is}));
          }

          if (v.isNumber(minimum) && length < minimum) {
            err = options.tooShort ||
              this.tooShort ||
              "is too short (minimum is %{count} characters)";
            errors.push(v.format(err, {count: minimum}));
          }

          if (v.isNumber(maximum) && length > maximum) {
            err = options.tooLong ||
              this.tooLong ||
              "is too long (maximum is %{count} characters)";
            errors.push(v.format(err, {count: maximum}));
          }

          if (errors.length > 0) {
            return options.message || errors;
          }
        },
        numericality: function(value, options, attribute, attributes, globalOptions) {
          // Empty values are fine
          if (!v.isDefined(value)) {
            return;
          }

          options = v.extend({}, this.options, options);

          var errors = []
            , name
            , count
            , checks = {
                greaterThan:          function(v, c) { return v > c; },
                greaterThanOrEqualTo: function(v, c) { return v >= c; },
                equalTo:              function(v, c) { return v === c; },
                lessThan:             function(v, c) { return v < c; },
                lessThanOrEqualTo:    function(v, c) { return v <= c; },
                divisibleBy:          function(v, c) { return v % c === 0; }
              }
            , prettify = options.prettify ||
              (globalOptions && globalOptions.prettify) ||
              v.prettify;

          // Strict will check that it is a valid looking number
          if (v.isString(value) && options.strict) {
            var pattern = "^-?(0|[1-9]\\d*)";
            if (!options.onlyInteger) {
              pattern += "(\\.\\d+)?";
            }
            pattern += "$";

            if (!(new RegExp(pattern).test(value))) {
              return options.message ||
                options.notValid ||
                this.notValid ||
                this.message ||
                "must be a valid number";
            }
          }

          // Coerce the value to a number unless we're being strict.
          if (options.noStrings !== true && v.isString(value) && !v.isEmpty(value)) {
            value = +value;
          }

          // If it's not a number we shouldn't continue since it will compare it.
          if (!v.isNumber(value)) {
            return options.message ||
              options.notValid ||
              this.notValid ||
              this.message ||
              "is not a number";
          }

          // Same logic as above, sort of. Don't bother with comparisons if this
          // doesn't pass.
          if (options.onlyInteger && !v.isInteger(value)) {
            return options.message ||
              options.notInteger ||
              this.notInteger ||
              this.message ||
              "must be an integer";
          }

          for (name in checks) {
            count = options[name];
            if (v.isNumber(count) && !checks[name](value, count)) {
              // This picks the default message if specified
              // For example the greaterThan check uses the message from
              // this.notGreaterThan so we capitalize the name and prepend "not"
              var key = "not" + v.capitalize(name);
              var msg = options[key] ||
                this[key] ||
                this.message ||
                "must be %{type} %{count}";

              errors.push(v.format(msg, {
                count: count,
                type: prettify(name)
              }));
            }
          }

          if (options.odd && value % 2 !== 1) {
            errors.push(options.notOdd ||
                this.notOdd ||
                this.message ||
                "must be odd");
          }
          if (options.even && value % 2 !== 0) {
            errors.push(options.notEven ||
                this.notEven ||
                this.message ||
                "must be even");
          }

          if (errors.length) {
            return options.message || errors;
          }
        },
        datetime: v.extend(function(value, options) {
          if (!v.isFunction(this.parse) || !v.isFunction(this.format)) {
            throw new Error("Both the parse and format functions needs to be set to use the datetime/date validator");
          }

          // Empty values are fine
          if (!v.isDefined(value)) {
            return;
          }

          options = v.extend({}, this.options, options);

          var err
            , errors = []
            , earliest = options.earliest ? this.parse(options.earliest, options) : NaN
            , latest = options.latest ? this.parse(options.latest, options) : NaN;

          value = this.parse(value, options);

          // 86400000 is the number of milliseconds in a day, this is used to remove
          // the time from the date
          if (isNaN(value) || options.dateOnly && value % 86400000 !== 0) {
            err = options.notValid ||
              options.message ||
              this.notValid ||
              "must be a valid date";
            return v.format(err, {value: arguments[0]});
          }

          if (!isNaN(earliest) && value < earliest) {
            err = options.tooEarly ||
              options.message ||
              this.tooEarly ||
              "must be no earlier than %{date}";
            err = v.format(err, {
              value: this.format(value, options),
              date: this.format(earliest, options)
            });
            errors.push(err);
          }

          if (!isNaN(latest) && value > latest) {
            err = options.tooLate ||
              options.message ||
              this.tooLate ||
              "must be no later than %{date}";
            err = v.format(err, {
              date: this.format(latest, options),
              value: this.format(value, options)
            });
            errors.push(err);
          }

          if (errors.length) {
            return v.unique(errors);
          }
        }, {
          parse: null,
          format: null
        }),
        date: function(value, options) {
          options = v.extend({}, options, {dateOnly: true});
          return v.validators.datetime.call(v.validators.datetime, value, options);
        },
        format: function(value, options) {
          if (v.isString(options) || (options instanceof RegExp)) {
            options = {pattern: options};
          }

          options = v.extend({}, this.options, options);

          var message = options.message || this.message || "is invalid"
            , pattern = options.pattern
            , match;

          // Empty values are allowed
          if (!v.isDefined(value)) {
            return;
          }
          if (!v.isString(value)) {
            return message;
          }

          if (v.isString(pattern)) {
            pattern = new RegExp(options.pattern, options.flags);
          }
          match = pattern.exec(value);
          if (!match || match[0].length != value.length) {
            return message;
          }
        },
        inclusion: function(value, options) {
          // Empty values are fine
          if (!v.isDefined(value)) {
            return;
          }
          if (v.isArray(options)) {
            options = {within: options};
          }
          options = v.extend({}, this.options, options);
          if (v.contains(options.within, value)) {
            return;
          }
          var message = options.message ||
            this.message ||
            "^%{value} is not included in the list";
          return v.format(message, {value: value});
        },
        exclusion: function(value, options) {
          // Empty values are fine
          if (!v.isDefined(value)) {
            return;
          }
          if (v.isArray(options)) {
            options = {within: options};
          }
          options = v.extend({}, this.options, options);
          if (!v.contains(options.within, value)) {
            return;
          }
          var message = options.message || this.message || "^%{value} is restricted";
          if (v.isString(options.within[value])) {
            value = options.within[value];
          }
          return v.format(message, {value: value});
        },
        email: v.extend(function(value, options) {
          options = v.extend({}, this.options, options);
          var message = options.message || this.message || "is not a valid email";
          // Empty values are fine
          if (!v.isDefined(value)) {
            return;
          }
          if (!v.isString(value)) {
            return message;
          }
          if (!this.PATTERN.exec(value)) {
            return message;
          }
        }, {
          PATTERN: /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i
        }),
        equality: function(value, options, attribute, attributes, globalOptions) {
          if (!v.isDefined(value)) {
            return;
          }

          if (v.isString(options)) {
            options = {attribute: options};
          }
          options = v.extend({}, this.options, options);
          var message = options.message ||
            this.message ||
            "is not equal to %{attribute}";

          if (v.isEmpty(options.attribute) || !v.isString(options.attribute)) {
            throw new Error("The attribute must be a non empty string");
          }

          var otherValue = v.getDeepObjectValue(attributes, options.attribute)
            , comparator = options.comparator || function(v1, v2) {
              return v1 === v2;
            }
            , prettify = options.prettify ||
              (globalOptions && globalOptions.prettify) ||
              v.prettify;

          if (!comparator(value, otherValue, options, attribute, attributes)) {
            return v.format(message, {attribute: prettify(options.attribute)});
          }
        },
        // A URL validator that is used to validate URLs with the ability to
        // restrict schemes and some domains.
        url: function(value, options) {
          if (!v.isDefined(value)) {
            return;
          }

          options = v.extend({}, this.options, options);

          var message = options.message || this.message || "is not a valid url"
            , schemes = options.schemes || this.schemes || ['http', 'https']
            , allowLocal = options.allowLocal || this.allowLocal || false
            , allowDataUrl = options.allowDataUrl || this.allowDataUrl || false;
          if (!v.isString(value)) {
            return message;
          }

          // https://gist.github.com/dperini/729294
          var regex =
            "^" +
            // protocol identifier
            "(?:(?:" + schemes.join("|") + ")://)" +
            // user:pass authentication
            "(?:\\S+(?::\\S*)?@)?" +
            "(?:";

          var tld = "(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))";

          if (allowLocal) {
            tld += "?";
          } else {
            regex +=
              // IP address exclusion
              // private & local networks
              "(?!(?:10|127)(?:\\.\\d{1,3}){3})" +
              "(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})" +
              "(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})";
          }

          regex +=
              // IP address dotted notation octets
              // excludes loopback network 0.0.0.0
              // excludes reserved space >= 224.0.0.0
              // excludes network & broacast addresses
              // (first & last IP address of each class)
              "(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])" +
              "(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}" +
              "(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))" +
            "|" +
              // host name
              "(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)" +
              // domain name
              "(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*" +
              tld +
            ")" +
            // port number
            "(?::\\d{2,5})?" +
            // resource path
            "(?:[/?#]\\S*)?" +
          "$";

          if (allowDataUrl) {
            // RFC 2397
            var mediaType = "\\w+\\/[-+.\\w]+(?:;[\\w=]+)*";
            var urlchar = "[A-Za-z0-9-_.!~\\*'();\\/?:@&=+$,%]*";
            var dataurl = "data:(?:"+mediaType+")?(?:;base64)?,"+urlchar;
            regex = "(?:"+regex+")|(?:^"+dataurl+"$)";
          }

          var PATTERN = new RegExp(regex, 'i');
          if (!PATTERN.exec(value)) {
            return message;
          }
        },
        type: v.extend(function(value, originalOptions, attribute, attributes, globalOptions) {
          if (v.isString(originalOptions)) {
            originalOptions = {type: originalOptions};
          }

          if (!v.isDefined(value)) {
            return;
          }

          var options = v.extend({}, this.options, originalOptions);

          var type = options.type;
          if (!v.isDefined(type)) {
            throw new Error("No type was specified");
          }

          var check;
          if (v.isFunction(type)) {
            check = type;
          } else {
            check = this.types[type];
          }

          if (!v.isFunction(check)) {
            throw new Error("validate.validators.type.types." + type + " must be a function.");
          }

          if (!check(value, options, attribute, attributes, globalOptions)) {
            var message = originalOptions.message ||
              this.messages[type] ||
              this.message ||
              options.message ||
              (v.isFunction(type) ? "must be of the correct type" : "must be of type %{type}");

            if (v.isFunction(message)) {
              message = message(value, originalOptions, attribute, attributes, globalOptions);
            }

            return v.format(message, {attribute: v.prettify(attribute), type: type});
          }
        }, {
          types: {
            object: function(value) {
              return v.isObject(value) && !v.isArray(value);
            },
            array: v.isArray,
            integer: v.isInteger,
            number: v.isNumber,
            string: v.isString,
            date: v.isDate,
            boolean: v.isBoolean
          },
          messages: {}
        })
      };

      validate.formatters = {
        detailed: function(errors) {return errors;},
        flat: v.flattenErrorsToArray,
        grouped: function(errors) {
          var attr;

          errors = v.groupErrorsByAttribute(errors);
          for (attr in errors) {
            errors[attr] = v.flattenErrorsToArray(errors[attr]);
          }
          return errors;
        },
        constraint: function(errors) {
          var attr;
          errors = v.groupErrorsByAttribute(errors);
          for (attr in errors) {
            errors[attr] = errors[attr].map(function(result) {
              return result.validator;
            }).sort();
          }
          return errors;
        }
      };

      validate.exposeModule(validate, this, exports, module, define);
    }).call(commonjsGlobal,
             /* istanbul ignore next */ exports ,
             /* istanbul ignore next */ module ,
             null);
    });

    /* src/c8s/TextField.svelte generated by Svelte v3.29.7 */
    const file$a = "src/c8s/TextField.svelte";

    function create_fragment$g(ctx) {
    	let div2;
    	let label_1;
    	let t0;
    	let t1;
    	let div1;
    	let input_1;
    	let t2;
    	let div0;
    	let t3_value = (/*errorMsg*/ ctx[2] || "") + "";
    	let t3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			label_1 = element("label");
    			t0 = text(/*label*/ ctx[1]);
    			t1 = space();
    			div1 = element("div");
    			input_1 = element("input");
    			t2 = space();
    			div0 = element("div");
    			t3 = text(t3_value);
    			attr_dev(label_1, "class", "");
    			add_location(label_1, file$a, 21, 4, 374);
    			attr_dev(input_1, "name", "title");
    			attr_dev(input_1, "type", "text");
    			attr_dev(input_1, "class", "px-2 border border-gray-400 focus:border-indigo-600 text-gray-700 focus:border-red-300 focus:outline-none rounded-sm");
    			attr_dev(input_1, "autocomplete", "off");
    			add_location(input_1, file$a, 23, 8, 457);
    			attr_dev(div0, "class", "h-4 md:h-8 text-red-500");
    			add_location(div0, file$a, 26, 8, 709);
    			attr_dev(div1, "class", "flex flex-col col-span-2");
    			add_location(div1, file$a, 22, 4, 410);
    			attr_dev(div2, "class", "grid sm:grid-cols-3 sm:gap-4 mb-2");
    			add_location(div2, file$a, 20, 0, 322);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, label_1);
    			append_dev(label_1, t0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, input_1);
    			/*input_1_binding*/ ctx[5](input_1);
    			set_input_value(input_1, /*value*/ ctx[0]);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			append_dev(div0, t3);

    			if (!mounted) {
    				dispose = listen_dev(input_1, "input", /*input_1_input_handler*/ ctx[6]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*label*/ 2) set_data_dev(t0, /*label*/ ctx[1]);

    			if (dirty & /*value*/ 1 && input_1.value !== /*value*/ ctx[0]) {
    				set_input_value(input_1, /*value*/ ctx[0]);
    			}

    			if (dirty & /*errorMsg*/ 4 && t3_value !== (t3_value = (/*errorMsg*/ ctx[2] || "") + "")) set_data_dev(t3, t3_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			/*input_1_binding*/ ctx[5](null);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("TextField", slots, []);
    	let { label } = $$props;
    	let { value } = $$props;
    	let { errorMsg } = $$props;
    	let { autofocus = undefined } = $$props;
    	let input;

    	onMount(() => {
    		if (autofocus) {
    			setTimeout(
    				() => {
    					input.focus();
    				},
    				0
    			);
    		}
    	});

    	const writable_props = ["label", "value", "errorMsg", "autofocus"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TextField> was created with unknown prop '${key}'`);
    	});

    	function input_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			input = $$value;
    			$$invalidate(3, input);
    		});
    	}

    	function input_1_input_handler() {
    		value = this.value;
    		$$invalidate(0, value);
    	}

    	$$self.$$set = $$props => {
    		if ("label" in $$props) $$invalidate(1, label = $$props.label);
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("errorMsg" in $$props) $$invalidate(2, errorMsg = $$props.errorMsg);
    		if ("autofocus" in $$props) $$invalidate(4, autofocus = $$props.autofocus);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		label,
    		value,
    		errorMsg,
    		autofocus,
    		input
    	});

    	$$self.$inject_state = $$props => {
    		if ("label" in $$props) $$invalidate(1, label = $$props.label);
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("errorMsg" in $$props) $$invalidate(2, errorMsg = $$props.errorMsg);
    		if ("autofocus" in $$props) $$invalidate(4, autofocus = $$props.autofocus);
    		if ("input" in $$props) $$invalidate(3, input = $$props.input);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		value,
    		label,
    		errorMsg,
    		input,
    		autofocus,
    		input_1_binding,
    		input_1_input_handler
    	];
    }

    class TextField extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$g, create_fragment$g, safe_not_equal, {
    			label: 1,
    			value: 0,
    			errorMsg: 2,
    			autofocus: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TextField",
    			options,
    			id: create_fragment$g.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*label*/ ctx[1] === undefined && !("label" in props)) {
    			console.warn("<TextField> was created without expected prop 'label'");
    		}

    		if (/*value*/ ctx[0] === undefined && !("value" in props)) {
    			console.warn("<TextField> was created without expected prop 'value'");
    		}

    		if (/*errorMsg*/ ctx[2] === undefined && !("errorMsg" in props)) {
    			console.warn("<TextField> was created without expected prop 'errorMsg'");
    		}
    	}

    	get label() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get errorMsg() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set errorMsg(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get autofocus() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set autofocus(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/c8s/Checkbox.svelte generated by Svelte v3.29.7 */

    const file$b = "src/c8s/Checkbox.svelte";

    function create_fragment$h(ctx) {
    	let div2;
    	let input;
    	let t0;
    	let div1;
    	let label_1;
    	let t1;
    	let t2;
    	let div0;
    	let t3_value = (/*errorMsg*/ ctx[2] || "") + "";
    	let t3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			input = element("input");
    			t0 = space();
    			div1 = element("div");
    			label_1 = element("label");
    			t1 = text(/*label*/ ctx[1]);
    			t2 = space();
    			div0 = element("div");
    			t3 = text(t3_value);
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "id", "checkbox");
    			add_location(input, file$b, 7, 4, 123);
    			attr_dev(label_1, "class", "ml-4");
    			attr_dev(label_1, "for", "checkbox");
    			add_location(label_1, file$b, 9, 8, 222);
    			attr_dev(div0, "class", "text-red-500");
    			add_location(div0, file$b, 10, 8, 281);
    			attr_dev(div1, "class", "flex flex-col");
    			add_location(div1, file$b, 8, 4, 186);
    			attr_dev(div2, "class", "flex items-center");
    			add_location(div2, file$b, 6, 0, 87);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, input);
    			input.checked = /*value*/ ctx[0];
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, label_1);
    			append_dev(label_1, t1);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			append_dev(div0, t3);

    			if (!mounted) {
    				dispose = listen_dev(input, "change", /*input_change_handler*/ ctx[3]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*value*/ 1) {
    				input.checked = /*value*/ ctx[0];
    			}

    			if (dirty & /*label*/ 2) set_data_dev(t1, /*label*/ ctx[1]);
    			if (dirty & /*errorMsg*/ 4 && t3_value !== (t3_value = (/*errorMsg*/ ctx[2] || "") + "")) set_data_dev(t3, t3_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Checkbox", slots, []);
    	let { label } = $$props;
    	let { value } = $$props;
    	let { errorMsg } = $$props;
    	const writable_props = ["label", "value", "errorMsg"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Checkbox> was created with unknown prop '${key}'`);
    	});

    	function input_change_handler() {
    		value = this.checked;
    		$$invalidate(0, value);
    	}

    	$$self.$$set = $$props => {
    		if ("label" in $$props) $$invalidate(1, label = $$props.label);
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("errorMsg" in $$props) $$invalidate(2, errorMsg = $$props.errorMsg);
    	};

    	$$self.$capture_state = () => ({ label, value, errorMsg });

    	$$self.$inject_state = $$props => {
    		if ("label" in $$props) $$invalidate(1, label = $$props.label);
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("errorMsg" in $$props) $$invalidate(2, errorMsg = $$props.errorMsg);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [value, label, errorMsg, input_change_handler];
    }

    class Checkbox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, { label: 1, value: 0, errorMsg: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Checkbox",
    			options,
    			id: create_fragment$h.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*label*/ ctx[1] === undefined && !("label" in props)) {
    			console.warn("<Checkbox> was created without expected prop 'label'");
    		}

    		if (/*value*/ ctx[0] === undefined && !("value" in props)) {
    			console.warn("<Checkbox> was created without expected prop 'value'");
    		}

    		if (/*errorMsg*/ ctx[2] === undefined && !("errorMsg" in props)) {
    			console.warn("<Checkbox> was created without expected prop 'errorMsg'");
    		}
    	}

    	get label() {
    		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get errorMsg() {
    		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set errorMsg(value) {
    		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /**
     * https://svelte.dev/repl/f1a7e24a08a54947bb4447f295c741fb?version=3.14.1
     * @param node text area to be autoresized
     * @returns {{destroy(): void}}
     */
    function autoresize(node) {
        const div = document.createElement('div');
        div.style.display = 'block';
        div.style.position = 'relative';

        const sizer = document.createElement('div');
        const style = getComputedStyle(node);
        Object.assign(sizer.style, {
            minHeight: style.minHeight,
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
            paddingTop: style.paddingTop,
            paddingLeft: style.paddingLeft,
            paddingBottom: style.paddingBottom,
            paddingRight: style.paddingRight,
            borderTopWidth: style.borderTopWidth,
            borderLeftWidth: style.borderLeftWidth,
            borderBottomWidth: style.borderBottomWidth,
            borderRightWidth: style.borderRightWidth,
            borderTopStyle: style.borderTopStyle,
            borderLeftStyle: style.borderLeftStyle,
            borderBottomStyle: style.borderBottomStyle,
            borderRightStyle: style.borderRightStyle,
            lineHeight: style.lineHeight,
            boxSizing: style.boxSizing,
            position: 'relative',
            whiteSpace: 'pre',
            visibility: 'hidden'
        });

        Object.assign(node.style, {
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            resize: 'none'
        });

        div.appendChild(sizer);
        node.parentNode.insertBefore(div, node);
        div.appendChild(node);

        function handleChange() {
            sizer.innerHTML = node.value + ' ';
        }

        handleChange();
        node.addEventListener('input', handleChange);

        return {
            destroy() {
                node.removeEventListener('input', handleChange);
            }
        };
    }

    /* src/c8s/TextAreaField.svelte generated by Svelte v3.29.7 */
    const file$c = "src/c8s/TextAreaField.svelte";

    function create_fragment$i(ctx) {
    	let div2;
    	let label_1;
    	let t0;
    	let t1;
    	let div1;
    	let textarea;
    	let autoresize_action;
    	let t2;
    	let div0;
    	let t3_value = (/*errorMsg*/ ctx[2] || "") + "";
    	let t3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			label_1 = element("label");
    			t0 = text(/*label*/ ctx[1]);
    			t1 = space();
    			div1 = element("div");
    			textarea = element("textarea");
    			t2 = space();
    			div0 = element("div");
    			t3 = text(t3_value);
    			attr_dev(label_1, "class", "");
    			add_location(label_1, file$c, 26, 4, 827);
    			attr_dev(textarea, "name", "title");
    			attr_dev(textarea, "class", "px-2 border border-gray-400 focus:border-indigo-600 text-gray-700 focus:border-red-300\n               focus:outline-none rounded-sm svelte-16zrj37");
    			attr_dev(textarea, "autocomplete", "off");
    			add_location(textarea, file$c, 28, 8, 910);
    			attr_dev(div0, "class", "h-4 md:h-8 text-red-500");
    			add_location(div0, file$c, 32, 8, 1198);
    			attr_dev(div1, "class", "flex flex-col col-span-2");
    			add_location(div1, file$c, 27, 4, 863);
    			attr_dev(div2, "class", "grid sm:grid-cols-3 sm:gap-4 mb-2");
    			add_location(div2, file$c, 25, 0, 775);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, label_1);
    			append_dev(label_1, t0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, textarea);
    			/*textarea_binding*/ ctx[5](textarea);
    			set_input_value(textarea, /*value*/ ctx[0]);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			append_dev(div0, t3);

    			if (!mounted) {
    				dispose = [
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[6]),
    					action_destroyer(autoresize_action = autoresize.call(null, textarea))
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*label*/ 2) set_data_dev(t0, /*label*/ ctx[1]);

    			if (dirty & /*value*/ 1) {
    				set_input_value(textarea, /*value*/ ctx[0]);
    			}

    			if (dirty & /*errorMsg*/ 4 && t3_value !== (t3_value = (/*errorMsg*/ ctx[2] || "") + "")) set_data_dev(t3, t3_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			/*textarea_binding*/ ctx[5](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$i($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("TextAreaField", slots, []);
    	let { label } = $$props;
    	let { value } = $$props;
    	let { errorMsg } = $$props;
    	let { autofocus = undefined } = $$props;
    	let input;

    	onMount(() => {
    		if (autofocus) {
    			setTimeout(
    				() => {
    					input.focus();
    				},
    				0
    			);
    		}
    	});

    	const writable_props = ["label", "value", "errorMsg", "autofocus"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TextAreaField> was created with unknown prop '${key}'`);
    	});

    	function textarea_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			input = $$value;
    			$$invalidate(3, input);
    		});
    	}

    	function textarea_input_handler() {
    		value = this.value;
    		$$invalidate(0, value);
    	}

    	$$self.$$set = $$props => {
    		if ("label" in $$props) $$invalidate(1, label = $$props.label);
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("errorMsg" in $$props) $$invalidate(2, errorMsg = $$props.errorMsg);
    		if ("autofocus" in $$props) $$invalidate(4, autofocus = $$props.autofocus);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		autoresize,
    		label,
    		value,
    		errorMsg,
    		autofocus,
    		input
    	});

    	$$self.$inject_state = $$props => {
    		if ("label" in $$props) $$invalidate(1, label = $$props.label);
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("errorMsg" in $$props) $$invalidate(2, errorMsg = $$props.errorMsg);
    		if ("autofocus" in $$props) $$invalidate(4, autofocus = $$props.autofocus);
    		if ("input" in $$props) $$invalidate(3, input = $$props.input);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		value,
    		label,
    		errorMsg,
    		input,
    		autofocus,
    		textarea_binding,
    		textarea_input_handler
    	];
    }

    class TextAreaField extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$i, create_fragment$i, safe_not_equal, {
    			label: 1,
    			value: 0,
    			errorMsg: 2,
    			autofocus: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TextAreaField",
    			options,
    			id: create_fragment$i.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*label*/ ctx[1] === undefined && !("label" in props)) {
    			console.warn("<TextAreaField> was created without expected prop 'label'");
    		}

    		if (/*value*/ ctx[0] === undefined && !("value" in props)) {
    			console.warn("<TextAreaField> was created without expected prop 'value'");
    		}

    		if (/*errorMsg*/ ctx[2] === undefined && !("errorMsg" in props)) {
    			console.warn("<TextAreaField> was created without expected prop 'errorMsg'");
    		}
    	}

    	get label() {
    		throw new Error("<TextAreaField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<TextAreaField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<TextAreaField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<TextAreaField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get errorMsg() {
    		throw new Error("<TextAreaField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set errorMsg(value) {
    		throw new Error("<TextAreaField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get autofocus() {
    		throw new Error("<TextAreaField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set autofocus(value) {
    		throw new Error("<TextAreaField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/c8s/Button.svelte generated by Svelte v3.29.7 */

    const file$d = "src/c8s/Button.svelte";

    function create_fragment$j(ctx) {
    	let button;
    	let t;
    	let button_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(/*name*/ ctx[0]);
    			button.disabled = /*disabled*/ ctx[2];

    			attr_dev(button, "class", button_class_value = "text-sm px-4 py-2 leading-none border rounded border-gray-500\n    " + (!/*defaultAction*/ ctx[1]
    			? "active:bg-gray-300"
    			: "bg-mytrack-light active:bg-mytrack-dark") + "\n\n   focus:outline-none\n lg:mt-0" + " svelte-1obhz8w");

    			add_location(button, file$d, 7, 0, 215);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*name*/ 1) set_data_dev(t, /*name*/ ctx[0]);

    			if (dirty & /*disabled*/ 4) {
    				prop_dev(button, "disabled", /*disabled*/ ctx[2]);
    			}

    			if (dirty & /*defaultAction*/ 2 && button_class_value !== (button_class_value = "text-sm px-4 py-2 leading-none border rounded border-gray-500\n    " + (!/*defaultAction*/ ctx[1]
    			? "active:bg-gray-300"
    			: "bg-mytrack-light active:bg-mytrack-dark") + "\n\n   focus:outline-none\n lg:mt-0" + " svelte-1obhz8w")) {
    				attr_dev(button, "class", button_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$j($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Button", slots, []);
    	let { name = "Button" } = $$props;
    	let { defaultAction = false } = $$props;
    	let { disabled } = $$props;
    	const writable_props = ["name", "defaultAction", "disabled"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("defaultAction" in $$props) $$invalidate(1, defaultAction = $$props.defaultAction);
    		if ("disabled" in $$props) $$invalidate(2, disabled = $$props.disabled);
    	};

    	$$self.$capture_state = () => ({ name, defaultAction, disabled });

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("defaultAction" in $$props) $$invalidate(1, defaultAction = $$props.defaultAction);
    		if ("disabled" in $$props) $$invalidate(2, disabled = $$props.disabled);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name, defaultAction, disabled, click_handler];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$j, create_fragment$j, safe_not_equal, { name: 0, defaultAction: 1, disabled: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$j.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*disabled*/ ctx[2] === undefined && !("disabled" in props)) {
    			console.warn("<Button> was created without expected prop 'disabled'");
    		}
    	}

    	get name() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get defaultAction() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set defaultAction(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/c8s/BusyCircle.svelte generated by Svelte v3.29.7 */

    const file$e = "src/c8s/BusyCircle.svelte";

    function create_fragment$k(ctx) {
    	let div;
    	let div_class_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", div_class_value = "border-t-2 border-l-2 rounded-full animate-spin circle w-" + /*size*/ ctx[0] + " h-" + /*size*/ ctx[0] + " border-mytrack-dark border-solid");
    			add_location(div, file$e, 4, 0, 45);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*size*/ 1 && div_class_value !== (div_class_value = "border-t-2 border-l-2 rounded-full animate-spin circle w-" + /*size*/ ctx[0] + " h-" + /*size*/ ctx[0] + " border-mytrack-dark border-solid")) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$k.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$k($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("BusyCircle", slots, []);
    	let { size = 16 } = $$props;
    	const writable_props = ["size"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<BusyCircle> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    	};

    	$$self.$capture_state = () => ({ size });

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [size];
    }

    class BusyCircle extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$k, create_fragment$k, safe_not_equal, { size: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BusyCircle",
    			options,
    			id: create_fragment$k.name
    		});
    	}

    	get size() {
    		throw new Error("<BusyCircle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<BusyCircle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/c8s/BusyScreen.svelte generated by Svelte v3.29.7 */
    const file$f = "src/c8s/BusyScreen.svelte";

    // (6:0) {#if loading}
    function create_if_block$3(ctx) {
    	let div;
    	let busycircle;
    	let current;
    	busycircle = new BusyCircle({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(busycircle.$$.fragment);
    			attr_dev(div, "class", "z-50 flex justify-center items-center opacity-75 bg-white w-full h-full absolute top-0 left-0");
    			attr_dev(div, "id", "busy-screen");
    			add_location(div, file$f, 6, 4, 119);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(busycircle, div, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(busycircle.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(busycircle.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(busycircle);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(6:0) {#if loading}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$l(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*loading*/ ctx[0] && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*loading*/ ctx[0]) {
    				if (if_block) {
    					if (dirty & /*loading*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$l.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$l($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("BusyScreen", slots, []);
    	let { loading = false } = $$props;
    	const writable_props = ["loading"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<BusyScreen> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("loading" in $$props) $$invalidate(0, loading = $$props.loading);
    	};

    	$$self.$capture_state = () => ({ loading, BusyCircle });

    	$$self.$inject_state = $$props => {
    		if ("loading" in $$props) $$invalidate(0, loading = $$props.loading);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [loading];
    }

    class BusyScreen extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$l, create_fragment$l, safe_not_equal, { loading: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BusyScreen",
    			options,
    			id: create_fragment$l.name
    		});
    	}

    	get loading() {
    		throw new Error("<BusyScreen>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set loading(value) {
    		throw new Error("<BusyScreen>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/c8s/ColorButton.svelte generated by Svelte v3.29.7 */

    const file$g = "src/c8s/ColorButton.svelte";

    function create_fragment$m(ctx) {
    	let button;
    	let t;
    	let button_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(/*name*/ ctx[0]);
    			button.disabled = /*disabled*/ ctx[1];
    			attr_dev(button, "class", button_class_value = "text-sm px-4 py-2 leading-none border rounded " + /*bgColor*/ ctx[2] + " " + /*textColor*/ ctx[3] + " active:" + /*pressedBackground*/ ctx[4] + "\n   " + /*extraStyle*/ ctx[5] + "\n\n   focus:outline-none\n lg:mt-0" + " svelte-1cttiij");
    			add_location(button, file$g, 10, 0, 330);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*name*/ 1) set_data_dev(t, /*name*/ ctx[0]);

    			if (dirty & /*disabled*/ 2) {
    				prop_dev(button, "disabled", /*disabled*/ ctx[1]);
    			}

    			if (dirty & /*bgColor, textColor, pressedBackground, extraStyle*/ 60 && button_class_value !== (button_class_value = "text-sm px-4 py-2 leading-none border rounded " + /*bgColor*/ ctx[2] + " " + /*textColor*/ ctx[3] + " active:" + /*pressedBackground*/ ctx[4] + "\n   " + /*extraStyle*/ ctx[5] + "\n\n   focus:outline-none\n lg:mt-0" + " svelte-1cttiij")) {
    				attr_dev(button, "class", button_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$m.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$m($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ColorButton", slots, []);
    	let { name = "Button" } = $$props;
    	let { disabled } = $$props;
    	let { bgColor = "border-gray-500" } = $$props;
    	let { textColor = "" } = $$props;
    	let { pressedBackground = "bg-gray-300" } = $$props;
    	let { extraStyle = "" } = $$props;
    	const writable_props = ["name", "disabled", "bgColor", "textColor", "pressedBackground", "extraStyle"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ColorButton> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("disabled" in $$props) $$invalidate(1, disabled = $$props.disabled);
    		if ("bgColor" in $$props) $$invalidate(2, bgColor = $$props.bgColor);
    		if ("textColor" in $$props) $$invalidate(3, textColor = $$props.textColor);
    		if ("pressedBackground" in $$props) $$invalidate(4, pressedBackground = $$props.pressedBackground);
    		if ("extraStyle" in $$props) $$invalidate(5, extraStyle = $$props.extraStyle);
    	};

    	$$self.$capture_state = () => ({
    		name,
    		disabled,
    		bgColor,
    		textColor,
    		pressedBackground,
    		extraStyle
    	});

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("disabled" in $$props) $$invalidate(1, disabled = $$props.disabled);
    		if ("bgColor" in $$props) $$invalidate(2, bgColor = $$props.bgColor);
    		if ("textColor" in $$props) $$invalidate(3, textColor = $$props.textColor);
    		if ("pressedBackground" in $$props) $$invalidate(4, pressedBackground = $$props.pressedBackground);
    		if ("extraStyle" in $$props) $$invalidate(5, extraStyle = $$props.extraStyle);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		name,
    		disabled,
    		bgColor,
    		textColor,
    		pressedBackground,
    		extraStyle,
    		click_handler
    	];
    }

    class ColorButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$m, create_fragment$m, safe_not_equal, {
    			name: 0,
    			disabled: 1,
    			bgColor: 2,
    			textColor: 3,
    			pressedBackground: 4,
    			extraStyle: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ColorButton",
    			options,
    			id: create_fragment$m.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*disabled*/ ctx[1] === undefined && !("disabled" in props)) {
    			console.warn("<ColorButton> was created without expected prop 'disabled'");
    		}
    	}

    	get name() {
    		throw new Error("<ColorButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<ColorButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<ColorButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<ColorButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bgColor() {
    		throw new Error("<ColorButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bgColor(value) {
    		throw new Error("<ColorButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get textColor() {
    		throw new Error("<ColorButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set textColor(value) {
    		throw new Error("<ColorButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pressedBackground() {
    		throw new Error("<ColorButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pressedBackground(value) {
    		throw new Error("<ColorButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get extraStyle() {
    		throw new Error("<ColorButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set extraStyle(value) {
    		throw new Error("<ColorButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/c8s/Form.svelte generated by Svelte v3.29.7 */

    const { Object: Object_1$1 } = globals;
    const file$h = "src/c8s/Form.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[18] = list[i][0];
    	child_ctx[19] = list[i][1];
    	child_ctx[20] = list;
    	child_ctx[21] = i;
    	return child_ctx;
    }

    // (64:42) 
    function create_if_block_2(ctx) {
    	let textareafield;
    	let updating_value;
    	let updating_errorMsg;
    	let current;

    	function textareafield_value_binding(value) {
    		/*textareafield_value_binding*/ ctx[16].call(null, value, /*key*/ ctx[18]);
    	}

    	function textareafield_errorMsg_binding(value) {
    		/*textareafield_errorMsg_binding*/ ctx[17].call(null, value, /*key*/ ctx[18]);
    	}

    	let textareafield_props = {
    		label: /*val*/ ctx[19].label,
    		autofocus: /*val*/ ctx[19].autofocus || false
    	};

    	if (/*dataObject*/ ctx[0][/*key*/ ctx[18]] !== void 0) {
    		textareafield_props.value = /*dataObject*/ ctx[0][/*key*/ ctx[18]];
    	}

    	if (/*validations*/ ctx[3][/*key*/ ctx[18]] !== void 0) {
    		textareafield_props.errorMsg = /*validations*/ ctx[3][/*key*/ ctx[18]];
    	}

    	textareafield = new TextAreaField({
    			props: textareafield_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(textareafield, "value", textareafield_value_binding));
    	binding_callbacks.push(() => bind(textareafield, "errorMsg", textareafield_errorMsg_binding));

    	const block = {
    		c: function create() {
    			create_component(textareafield.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(textareafield, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const textareafield_changes = {};
    			if (dirty & /*fields*/ 2) textareafield_changes.label = /*val*/ ctx[19].label;
    			if (dirty & /*fields*/ 2) textareafield_changes.autofocus = /*val*/ ctx[19].autofocus || false;

    			if (!updating_value && dirty & /*dataObject, Object, fields*/ 3) {
    				updating_value = true;
    				textareafield_changes.value = /*dataObject*/ ctx[0][/*key*/ ctx[18]];
    				add_flush_callback(() => updating_value = false);
    			}

    			if (!updating_errorMsg && dirty & /*validations, Object, fields*/ 10) {
    				updating_errorMsg = true;
    				textareafield_changes.errorMsg = /*validations*/ ctx[3][/*key*/ ctx[18]];
    				add_flush_callback(() => updating_errorMsg = false);
    			}

    			textareafield.$set(textareafield_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textareafield.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textareafield.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(textareafield, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(64:42) ",
    		ctx
    	});

    	return block;
    }

    // (62:42) 
    function create_if_block_1$1(ctx) {
    	let checkbox;
    	let updating_value;
    	let updating_errorMsg;
    	let current;

    	function checkbox_value_binding(value) {
    		/*checkbox_value_binding*/ ctx[14].call(null, value, /*key*/ ctx[18]);
    	}

    	function checkbox_errorMsg_binding(value) {
    		/*checkbox_errorMsg_binding*/ ctx[15].call(null, value, /*key*/ ctx[18]);
    	}

    	let checkbox_props = { label: /*val*/ ctx[19].label };

    	if (/*dataObject*/ ctx[0][/*key*/ ctx[18]] !== void 0) {
    		checkbox_props.value = /*dataObject*/ ctx[0][/*key*/ ctx[18]];
    	}

    	if (/*validations*/ ctx[3][/*key*/ ctx[18]] !== void 0) {
    		checkbox_props.errorMsg = /*validations*/ ctx[3][/*key*/ ctx[18]];
    	}

    	checkbox = new Checkbox({ props: checkbox_props, $$inline: true });
    	binding_callbacks.push(() => bind(checkbox, "value", checkbox_value_binding));
    	binding_callbacks.push(() => bind(checkbox, "errorMsg", checkbox_errorMsg_binding));

    	const block = {
    		c: function create() {
    			create_component(checkbox.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(checkbox, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const checkbox_changes = {};
    			if (dirty & /*fields*/ 2) checkbox_changes.label = /*val*/ ctx[19].label;

    			if (!updating_value && dirty & /*dataObject, Object, fields*/ 3) {
    				updating_value = true;
    				checkbox_changes.value = /*dataObject*/ ctx[0][/*key*/ ctx[18]];
    				add_flush_callback(() => updating_value = false);
    			}

    			if (!updating_errorMsg && dirty & /*validations, Object, fields*/ 10) {
    				updating_errorMsg = true;
    				checkbox_changes.errorMsg = /*validations*/ ctx[3][/*key*/ ctx[18]];
    				add_flush_callback(() => updating_errorMsg = false);
    			}

    			checkbox.$set(checkbox_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(checkbox.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(checkbox.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(checkbox, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(62:42) ",
    		ctx
    	});

    	return block;
    }

    // (59:8) {#if val.type === 'text'}
    function create_if_block$4(ctx) {
    	let textfield;
    	let updating_value;
    	let updating_errorMsg;
    	let current;

    	function textfield_value_binding(value) {
    		/*textfield_value_binding*/ ctx[12].call(null, value, /*key*/ ctx[18]);
    	}

    	function textfield_errorMsg_binding(value) {
    		/*textfield_errorMsg_binding*/ ctx[13].call(null, value, /*key*/ ctx[18]);
    	}

    	let textfield_props = {
    		label: /*val*/ ctx[19].label,
    		autofocus: /*val*/ ctx[19].autofocus || false
    	};

    	if (/*dataObject*/ ctx[0][/*key*/ ctx[18]] !== void 0) {
    		textfield_props.value = /*dataObject*/ ctx[0][/*key*/ ctx[18]];
    	}

    	if (/*validations*/ ctx[3][/*key*/ ctx[18]] !== void 0) {
    		textfield_props.errorMsg = /*validations*/ ctx[3][/*key*/ ctx[18]];
    	}

    	textfield = new TextField({ props: textfield_props, $$inline: true });
    	binding_callbacks.push(() => bind(textfield, "value", textfield_value_binding));
    	binding_callbacks.push(() => bind(textfield, "errorMsg", textfield_errorMsg_binding));

    	const block = {
    		c: function create() {
    			create_component(textfield.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(textfield, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const textfield_changes = {};
    			if (dirty & /*fields*/ 2) textfield_changes.label = /*val*/ ctx[19].label;
    			if (dirty & /*fields*/ 2) textfield_changes.autofocus = /*val*/ ctx[19].autofocus || false;

    			if (!updating_value && dirty & /*dataObject, Object, fields*/ 3) {
    				updating_value = true;
    				textfield_changes.value = /*dataObject*/ ctx[0][/*key*/ ctx[18]];
    				add_flush_callback(() => updating_value = false);
    			}

    			if (!updating_errorMsg && dirty & /*validations, Object, fields*/ 10) {
    				updating_errorMsg = true;
    				textfield_changes.errorMsg = /*validations*/ ctx[3][/*key*/ ctx[18]];
    				add_flush_callback(() => updating_errorMsg = false);
    			}

    			textfield.$set(textfield_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textfield.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textfield.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(textfield, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(59:8) {#if val.type === 'text'}",
    		ctx
    	});

    	return block;
    }

    // (58:4) {#each Object.entries(fields) as [key, val] (key)}
    function create_each_block$1(key_1, ctx) {
    	let first;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$4, create_if_block_1$1, create_if_block_2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*val*/ ctx[19].type === "text") return 0;
    		if (/*val*/ ctx[19].type === "checkbox") return 1;
    		if (/*val*/ ctx[19].type === "textarea") return 2;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					} else {
    						if_block.p(ctx, dirty);
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(58:4) {#each Object.entries(fields) as [key, val] (key)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$n(ctx) {
    	let div2;
    	let busyscreen;
    	let t0;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t1;
    	let div1;
    	let button0;
    	let t2;
    	let div0;
    	let t3;
    	let colorbutton;
    	let t4;
    	let button1;
    	let current;
    	let mounted;
    	let dispose;

    	busyscreen = new BusyScreen({
    			props: { loading: /*processing*/ ctx[5] },
    			$$inline: true
    		});

    	let each_value = Object.entries(/*fields*/ ctx[1]);
    	validate_each_argument(each_value);
    	const get_key = ctx => /*key*/ ctx[18];
    	validate_each_keys(ctx, each_value, get_each_context$1, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

    	button0 = new Button({
    			props: {
    				name: "Save",
    				defaultAction: "true",
    				disabled: !/*formIsValid*/ ctx[4]
    			},
    			$$inline: true
    		});

    	button0.$on("click", /*doSubmit*/ ctx[6]);

    	colorbutton = new ColorButton({
    			props: {
    				name: "Delete",
    				textColor: "text-white",
    				bgColor: "bg-red-700",
    				pressedBackground: "bg-red-900",
    				extraStyle: "px-0"
    			},
    			$$inline: true
    		});

    	colorbutton.$on("click", /*doDelete*/ ctx[7]);

    	button1 = new Button({
    			props: { name: "Cancel" },
    			$$inline: true
    		});

    	button1.$on("click", function () {
    		if (is_function(/*onCancel*/ ctx[2])) /*onCancel*/ ctx[2].apply(this, arguments);
    	});

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			create_component(busyscreen.$$.fragment);
    			t0 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			div1 = element("div");
    			create_component(button0.$$.fragment);
    			t2 = space();
    			div0 = element("div");
    			t3 = space();
    			create_component(colorbutton.$$.fragment);
    			t4 = space();
    			create_component(button1.$$.fragment);
    			add_location(div0, file$h, 70, 8, 2207);
    			attr_dev(div1, "class", "mt-4 grid grid-cols-4 md:grid-cols-4 gap-4");
    			attr_dev(div1, "id", "form-action-bar");
    			add_location(div1, file$h, 68, 4, 2024);
    			attr_dev(div2, "class", "grid relative w-full");
    			add_location(div2, file$h, 55, 0, 1287);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			mount_component(busyscreen, div2, null);
    			append_dev(div2, t0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}

    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			mount_component(button0, div1, null);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			append_dev(div1, t3);
    			mount_component(colorbutton, div1, null);
    			append_dev(div1, t4);
    			mount_component(button1, div1, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div2, "keydown", /*onKeyDown*/ ctx[8], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			const busyscreen_changes = {};
    			if (dirty & /*processing*/ 32) busyscreen_changes.loading = /*processing*/ ctx[5];
    			busyscreen.$set(busyscreen_changes);

    			if (dirty & /*Object, fields, dataObject, validations*/ 11) {
    				const each_value = Object.entries(/*fields*/ ctx[1]);
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div2, outro_and_destroy_block, create_each_block$1, t1, get_each_context$1);
    				check_outros();
    			}

    			const button0_changes = {};
    			if (dirty & /*formIsValid*/ 16) button0_changes.disabled = !/*formIsValid*/ ctx[4];
    			button0.$set(button0_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(busyscreen.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(button0.$$.fragment, local);
    			transition_in(colorbutton.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(busyscreen.$$.fragment, local);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(button0.$$.fragment, local);
    			transition_out(colorbutton.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(busyscreen);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			destroy_component(button0);
    			destroy_component(colorbutton);
    			destroy_component(button1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$n.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$n($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Form", slots, []);
    	let { dataObject } = $$props;
    	let { fields } = $$props;
    	let { constraints } = $$props;
    	let { onSubmit } = $$props;
    	let { onDelete } = $$props;

    	let { onCancel = () => {
    		pop();
    	} } = $$props;

    	let validations = {};
    	let formIsValid = false;
    	let processing = false;

    	async function doSubmit() {
    		$$invalidate(5, processing = true);
    		await onSubmit(dataObject);
    		$$invalidate(5, processing = false);
    	}

    	async function doDelete() {
    		$$invalidate(5, processing = true);
    		await onDelete(dataObject);
    		$$invalidate(5, processing = false);
    	}

    	function onKeyDown(e) {
    		if (e.ctrlKey && e.key === "Enter" && formIsValid) {
    			doSubmit();
    		}
    	}

    	const writable_props = ["dataObject", "fields", "constraints", "onSubmit", "onDelete", "onCancel"];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Form> was created with unknown prop '${key}'`);
    	});

    	function textfield_value_binding(value, key) {
    		dataObject[key] = value;
    		$$invalidate(0, dataObject);
    	}

    	function textfield_errorMsg_binding(value, key) {
    		validations[key] = value;
    		(($$invalidate(3, validations), $$invalidate(0, dataObject)), $$invalidate(9, constraints));
    	}

    	function checkbox_value_binding(value, key) {
    		dataObject[key] = value;
    		$$invalidate(0, dataObject);
    	}

    	function checkbox_errorMsg_binding(value, key) {
    		validations[key] = value;
    		(($$invalidate(3, validations), $$invalidate(0, dataObject)), $$invalidate(9, constraints));
    	}

    	function textareafield_value_binding(value, key) {
    		dataObject[key] = value;
    		$$invalidate(0, dataObject);
    	}

    	function textareafield_errorMsg_binding(value, key) {
    		validations[key] = value;
    		(($$invalidate(3, validations), $$invalidate(0, dataObject)), $$invalidate(9, constraints));
    	}

    	$$self.$$set = $$props => {
    		if ("dataObject" in $$props) $$invalidate(0, dataObject = $$props.dataObject);
    		if ("fields" in $$props) $$invalidate(1, fields = $$props.fields);
    		if ("constraints" in $$props) $$invalidate(9, constraints = $$props.constraints);
    		if ("onSubmit" in $$props) $$invalidate(10, onSubmit = $$props.onSubmit);
    		if ("onDelete" in $$props) $$invalidate(11, onDelete = $$props.onDelete);
    		if ("onCancel" in $$props) $$invalidate(2, onCancel = $$props.onCancel);
    	};

    	$$self.$capture_state = () => ({
    		validate: validate.validate,
    		TextField,
    		Checkbox,
    		TextAreaField,
    		Button,
    		pop,
    		BusyScreen,
    		ColorButton,
    		dataObject,
    		fields,
    		constraints,
    		onSubmit,
    		onDelete,
    		onCancel,
    		validations,
    		formIsValid,
    		processing,
    		doSubmit,
    		doDelete,
    		onKeyDown
    	});

    	$$self.$inject_state = $$props => {
    		if ("dataObject" in $$props) $$invalidate(0, dataObject = $$props.dataObject);
    		if ("fields" in $$props) $$invalidate(1, fields = $$props.fields);
    		if ("constraints" in $$props) $$invalidate(9, constraints = $$props.constraints);
    		if ("onSubmit" in $$props) $$invalidate(10, onSubmit = $$props.onSubmit);
    		if ("onDelete" in $$props) $$invalidate(11, onDelete = $$props.onDelete);
    		if ("onCancel" in $$props) $$invalidate(2, onCancel = $$props.onCancel);
    		if ("validations" in $$props) $$invalidate(3, validations = $$props.validations);
    		if ("formIsValid" in $$props) $$invalidate(4, formIsValid = $$props.formIsValid);
    		if ("processing" in $$props) $$invalidate(5, processing = $$props.processing);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*dataObject, constraints*/ 513) {
    			 {
    				//console.log(dataObject)
    				let vRes = validate.validate(dataObject, constraints);

    				$$invalidate(4, formIsValid = vRes === undefined);
    				$$invalidate(3, validations = vRes || {});
    			}
    		}
    	};

    	return [
    		dataObject,
    		fields,
    		onCancel,
    		validations,
    		formIsValid,
    		processing,
    		doSubmit,
    		doDelete,
    		onKeyDown,
    		constraints,
    		onSubmit,
    		onDelete,
    		textfield_value_binding,
    		textfield_errorMsg_binding,
    		checkbox_value_binding,
    		checkbox_errorMsg_binding,
    		textareafield_value_binding,
    		textareafield_errorMsg_binding
    	];
    }

    class Form extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$n, create_fragment$n, safe_not_equal, {
    			dataObject: 0,
    			fields: 1,
    			constraints: 9,
    			onSubmit: 10,
    			onDelete: 11,
    			onCancel: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Form",
    			options,
    			id: create_fragment$n.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*dataObject*/ ctx[0] === undefined && !("dataObject" in props)) {
    			console.warn("<Form> was created without expected prop 'dataObject'");
    		}

    		if (/*fields*/ ctx[1] === undefined && !("fields" in props)) {
    			console.warn("<Form> was created without expected prop 'fields'");
    		}

    		if (/*constraints*/ ctx[9] === undefined && !("constraints" in props)) {
    			console.warn("<Form> was created without expected prop 'constraints'");
    		}

    		if (/*onSubmit*/ ctx[10] === undefined && !("onSubmit" in props)) {
    			console.warn("<Form> was created without expected prop 'onSubmit'");
    		}

    		if (/*onDelete*/ ctx[11] === undefined && !("onDelete" in props)) {
    			console.warn("<Form> was created without expected prop 'onDelete'");
    		}
    	}

    	get dataObject() {
    		throw new Error("<Form>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dataObject(value) {
    		throw new Error("<Form>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fields() {
    		throw new Error("<Form>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fields(value) {
    		throw new Error("<Form>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get constraints() {
    		throw new Error("<Form>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set constraints(value) {
    		throw new Error("<Form>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onSubmit() {
    		throw new Error("<Form>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onSubmit(value) {
    		throw new Error("<Form>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onDelete() {
    		throw new Error("<Form>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onDelete(value) {
    		throw new Error("<Form>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onCancel() {
    		throw new Error("<Form>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onCancel(value) {
    		throw new Error("<Form>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/routes/ProjectEdit.svelte generated by Svelte v3.29.7 */

    const { console: console_1$3 } = globals;
    const file$i = "src/routes/ProjectEdit.svelte";

    // (60:4) <CenteredFlex extraClasses="relative px-2">
    function create_default_slot_1$2(ctx) {
    	let busyscreen;
    	let t0;
    	let h1;

    	let t1_value = (/*params*/ ctx[1].id
    	? "New project"
    	: `Edit project: ${name}`) + "";

    	let t1;
    	let t2;
    	let form;
    	let current;

    	busyscreen = new BusyScreen({
    			props: { loading: /*loading*/ ctx[2] },
    			$$inline: true
    		});

    	form = new Form({
    			props: {
    				dataObject: /*project*/ ctx[0],
    				fields: /*fields*/ ctx[3],
    				onSubmit: /*saveProject*/ ctx[5],
    				constraints: /*constraints*/ ctx[4]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(busyscreen.$$.fragment);
    			t0 = space();
    			h1 = element("h1");
    			t1 = text(t1_value);
    			t2 = space();
    			create_component(form.$$.fragment);
    			attr_dev(h1, "class", "text-xl mb-4");
    			add_location(h1, file$i, 61, 8, 1422);
    		},
    		m: function mount(target, anchor) {
    			mount_component(busyscreen, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t1);
    			insert_dev(target, t2, anchor);
    			mount_component(form, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const busyscreen_changes = {};
    			if (dirty & /*loading*/ 4) busyscreen_changes.loading = /*loading*/ ctx[2];
    			busyscreen.$set(busyscreen_changes);

    			if ((!current || dirty & /*params*/ 2) && t1_value !== (t1_value = (/*params*/ ctx[1].id
    			? "New project"
    			: `Edit project: ${name}`) + "")) set_data_dev(t1, t1_value);

    			const form_changes = {};
    			if (dirty & /*project*/ 1) form_changes.dataObject = /*project*/ ctx[0];
    			form.$set(form_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(busyscreen.$$.fragment, local);
    			transition_in(form.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(busyscreen.$$.fragment, local);
    			transition_out(form.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(busyscreen, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t2);
    			destroy_component(form, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$2.name,
    		type: "slot",
    		source: "(60:4) <CenteredFlex extraClasses=\\\"relative px-2\\\">",
    		ctx
    	});

    	return block;
    }

    // (59:0) <Layout>
    function create_default_slot$4(ctx) {
    	let centeredflex;
    	let current;

    	centeredflex = new CenteredFlex({
    			props: {
    				extraClasses: "relative px-2",
    				$$slots: { default: [create_default_slot_1$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(centeredflex.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(centeredflex, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const centeredflex_changes = {};

    			if (dirty & /*$$scope, project, params, loading*/ 135) {
    				centeredflex_changes.$$scope = { dirty, ctx };
    			}

    			centeredflex.$set(centeredflex_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(centeredflex.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(centeredflex.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(centeredflex, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$4.name,
    		type: "slot",
    		source: "(59:0) <Layout>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$o(ctx) {
    	let layout;
    	let current;

    	layout = new Layout({
    			props: {
    				$$slots: { default: [create_default_slot$4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(layout.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(layout, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const layout_changes = {};

    			if (dirty & /*$$scope, project, params, loading*/ 135) {
    				layout_changes.$$scope = { dirty, ctx };
    			}

    			layout.$set(layout_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(layout.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(layout.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(layout, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$o.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$o($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ProjectEdit", slots, []);
    	let { params = {} } = $$props;
    	let loading = true;
    	let api = new Api();
    	let { project = { title: undefined, description: "" } } = $$props;

    	let fields = {
    		title: {
    			type: "text",
    			label: "Title",
    			autofocus: true
    		},
    		description: { type: "textarea", label: "Description" }
    	};

    	let constraints = {
    		title: { presence: { allowEmpty: false } }
    	};

    	onMount(async () => {
    		if (params.id) {
    			try {
    				$$invalidate(0, project = await api.getProject(params.id));
    			} catch(e) {
    				console.log(e);
    			}
    		}

    		$$invalidate(2, loading = false);
    	});

    	async function saveProject(project) {
    		let saved = await api.saveProject(project);
    		push("#/projects");
    		params.id;
    	}

    	const writable_props = ["params", "project"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$3.warn(`<ProjectEdit> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("params" in $$props) $$invalidate(1, params = $$props.params);
    		if ("project" in $$props) $$invalidate(0, project = $$props.project);
    	};

    	$$self.$capture_state = () => ({
    		Layout,
    		CenteredFlex,
    		Form,
    		Api,
    		push,
    		onMount,
    		BusyScreen,
    		params,
    		loading,
    		api,
    		project,
    		fields,
    		constraints,
    		saveProject
    	});

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(1, params = $$props.params);
    		if ("loading" in $$props) $$invalidate(2, loading = $$props.loading);
    		if ("api" in $$props) api = $$props.api;
    		if ("project" in $$props) $$invalidate(0, project = $$props.project);
    		if ("fields" in $$props) $$invalidate(3, fields = $$props.fields);
    		if ("constraints" in $$props) $$invalidate(4, constraints = $$props.constraints);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [project, params, loading, fields, constraints, saveProject];
    }

    class ProjectEdit extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$o, create_fragment$o, safe_not_equal, { params: 1, project: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ProjectEdit",
    			options,
    			id: create_fragment$o.name
    		});
    	}

    	get params() {
    		throw new Error("<ProjectEdit>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<ProjectEdit>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get project() {
    		throw new Error("<ProjectEdit>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set project(value) {
    		throw new Error("<ProjectEdit>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/c8s/InstanceEdit.svelte generated by Svelte v3.29.7 */
    const file$j = "src/c8s/InstanceEdit.svelte";

    // (44:0) <CenteredFlex extraClasses="relative">
    function create_default_slot$5(ctx) {
    	let busyscreen;
    	let t0;
    	let h1;

    	let t1_value = (/*isNew*/ ctx[1]
    	? `New ${/*name*/ ctx[2]}`
    	: `Edit ${/*name*/ ctx[2]}`) + "";

    	let t1;
    	let t2;
    	let form;
    	let current;

    	busyscreen = new BusyScreen({
    			props: { loading: /*loading*/ ctx[5] },
    			$$inline: true
    		});

    	form = new Form({
    			props: {
    				dataObject: /*dataObject*/ ctx[0],
    				fields: /*fields*/ ctx[3],
    				onSubmit: /*saveInstance*/ ctx[6],
    				constraints: /*constraints*/ ctx[4],
    				onDelete: /*deleteInstance*/ ctx[7]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(busyscreen.$$.fragment);
    			t0 = space();
    			h1 = element("h1");
    			t1 = text(t1_value);
    			t2 = space();
    			create_component(form.$$.fragment);
    			attr_dev(h1, "class", "text-xl mb-4");
    			add_location(h1, file$j, 45, 4, 1816);
    		},
    		m: function mount(target, anchor) {
    			mount_component(busyscreen, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t1);
    			insert_dev(target, t2, anchor);
    			mount_component(form, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const busyscreen_changes = {};
    			if (dirty & /*loading*/ 32) busyscreen_changes.loading = /*loading*/ ctx[5];
    			busyscreen.$set(busyscreen_changes);

    			if ((!current || dirty & /*isNew, name*/ 6) && t1_value !== (t1_value = (/*isNew*/ ctx[1]
    			? `New ${/*name*/ ctx[2]}`
    			: `Edit ${/*name*/ ctx[2]}`) + "")) set_data_dev(t1, t1_value);

    			const form_changes = {};
    			if (dirty & /*dataObject*/ 1) form_changes.dataObject = /*dataObject*/ ctx[0];
    			if (dirty & /*fields*/ 8) form_changes.fields = /*fields*/ ctx[3];
    			if (dirty & /*constraints*/ 16) form_changes.constraints = /*constraints*/ ctx[4];
    			form.$set(form_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(busyscreen.$$.fragment, local);
    			transition_in(form.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(busyscreen.$$.fragment, local);
    			transition_out(form.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(busyscreen, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t2);
    			destroy_component(form, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$5.name,
    		type: "slot",
    		source: "(44:0) <CenteredFlex extraClasses=\\\"relative\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$p(ctx) {
    	let centeredflex;
    	let current;

    	centeredflex = new CenteredFlex({
    			props: {
    				extraClasses: "relative",
    				$$slots: { default: [create_default_slot$5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(centeredflex.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(centeredflex, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const centeredflex_changes = {};

    			if (dirty & /*$$scope, dataObject, fields, constraints, isNew, name, loading*/ 4159) {
    				centeredflex_changes.$$scope = { dirty, ctx };
    			}

    			centeredflex.$set(centeredflex_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(centeredflex.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(centeredflex.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(centeredflex, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$p.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$p($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("InstanceEdit", slots, []);
    	let { isNew = true } = $$props; //defines if the dataObject is a new instance
    	let { name = "" } = $$props; //The name of the instance
    	let { dataObject } = $$props; //data object to perform CRUD operations with
    	let { fields } = $$props; //description of the fields
    	let { constraints } = $$props; //fields validation constraints
    	let { readFunc } = $$props; //instance async read function. will be called on mount. The function must return a data object
    	let { saveFunc } = $$props; //instance async create and update function. will be called when the save button pressed. Takes modified object as an argument
    	let { deleteFunc } = $$props; //instancy asycn delete function. will be called when the delete button pressed. Takes current instance as an argument
    	let { redirect } = $$props; //function that returns redirect uri after object is saved. function can accept saved instance as an argument

    	// the second argument is true when item was deleted
    	let loading = true;

    	onMount(async () => {
    		if (!isNew) {
    			$$invalidate(0, dataObject = await readFunc());
    		}

    		$$invalidate(5, loading = false);
    	});

    	async function saveInstance(obj) {
    		let saved = await saveFunc(obj);
    		push(redirect(saved, false));
    	}

    	async function deleteInstance(obj) {
    		await deleteFunc(obj);
    		push(redirect(null, true));
    	}

    	const writable_props = [
    		"isNew",
    		"name",
    		"dataObject",
    		"fields",
    		"constraints",
    		"readFunc",
    		"saveFunc",
    		"deleteFunc",
    		"redirect"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<InstanceEdit> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("isNew" in $$props) $$invalidate(1, isNew = $$props.isNew);
    		if ("name" in $$props) $$invalidate(2, name = $$props.name);
    		if ("dataObject" in $$props) $$invalidate(0, dataObject = $$props.dataObject);
    		if ("fields" in $$props) $$invalidate(3, fields = $$props.fields);
    		if ("constraints" in $$props) $$invalidate(4, constraints = $$props.constraints);
    		if ("readFunc" in $$props) $$invalidate(8, readFunc = $$props.readFunc);
    		if ("saveFunc" in $$props) $$invalidate(9, saveFunc = $$props.saveFunc);
    		if ("deleteFunc" in $$props) $$invalidate(10, deleteFunc = $$props.deleteFunc);
    		if ("redirect" in $$props) $$invalidate(11, redirect = $$props.redirect);
    	};

    	$$self.$capture_state = () => ({
    		Layout,
    		CenteredFlex,
    		Form,
    		push,
    		onMount,
    		BusyScreen,
    		isNew,
    		name,
    		dataObject,
    		fields,
    		constraints,
    		readFunc,
    		saveFunc,
    		deleteFunc,
    		redirect,
    		loading,
    		saveInstance,
    		deleteInstance
    	});

    	$$self.$inject_state = $$props => {
    		if ("isNew" in $$props) $$invalidate(1, isNew = $$props.isNew);
    		if ("name" in $$props) $$invalidate(2, name = $$props.name);
    		if ("dataObject" in $$props) $$invalidate(0, dataObject = $$props.dataObject);
    		if ("fields" in $$props) $$invalidate(3, fields = $$props.fields);
    		if ("constraints" in $$props) $$invalidate(4, constraints = $$props.constraints);
    		if ("readFunc" in $$props) $$invalidate(8, readFunc = $$props.readFunc);
    		if ("saveFunc" in $$props) $$invalidate(9, saveFunc = $$props.saveFunc);
    		if ("deleteFunc" in $$props) $$invalidate(10, deleteFunc = $$props.deleteFunc);
    		if ("redirect" in $$props) $$invalidate(11, redirect = $$props.redirect);
    		if ("loading" in $$props) $$invalidate(5, loading = $$props.loading);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		dataObject,
    		isNew,
    		name,
    		fields,
    		constraints,
    		loading,
    		saveInstance,
    		deleteInstance,
    		readFunc,
    		saveFunc,
    		deleteFunc,
    		redirect
    	];
    }

    class InstanceEdit extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$p, create_fragment$p, safe_not_equal, {
    			isNew: 1,
    			name: 2,
    			dataObject: 0,
    			fields: 3,
    			constraints: 4,
    			readFunc: 8,
    			saveFunc: 9,
    			deleteFunc: 10,
    			redirect: 11
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "InstanceEdit",
    			options,
    			id: create_fragment$p.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*dataObject*/ ctx[0] === undefined && !("dataObject" in props)) {
    			console.warn("<InstanceEdit> was created without expected prop 'dataObject'");
    		}

    		if (/*fields*/ ctx[3] === undefined && !("fields" in props)) {
    			console.warn("<InstanceEdit> was created without expected prop 'fields'");
    		}

    		if (/*constraints*/ ctx[4] === undefined && !("constraints" in props)) {
    			console.warn("<InstanceEdit> was created without expected prop 'constraints'");
    		}

    		if (/*readFunc*/ ctx[8] === undefined && !("readFunc" in props)) {
    			console.warn("<InstanceEdit> was created without expected prop 'readFunc'");
    		}

    		if (/*saveFunc*/ ctx[9] === undefined && !("saveFunc" in props)) {
    			console.warn("<InstanceEdit> was created without expected prop 'saveFunc'");
    		}

    		if (/*deleteFunc*/ ctx[10] === undefined && !("deleteFunc" in props)) {
    			console.warn("<InstanceEdit> was created without expected prop 'deleteFunc'");
    		}

    		if (/*redirect*/ ctx[11] === undefined && !("redirect" in props)) {
    			console.warn("<InstanceEdit> was created without expected prop 'redirect'");
    		}
    	}

    	get isNew() {
    		throw new Error("<InstanceEdit>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isNew(value) {
    		throw new Error("<InstanceEdit>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get name() {
    		throw new Error("<InstanceEdit>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<InstanceEdit>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dataObject() {
    		throw new Error("<InstanceEdit>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dataObject(value) {
    		throw new Error("<InstanceEdit>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fields() {
    		throw new Error("<InstanceEdit>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fields(value) {
    		throw new Error("<InstanceEdit>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get constraints() {
    		throw new Error("<InstanceEdit>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set constraints(value) {
    		throw new Error("<InstanceEdit>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get readFunc() {
    		throw new Error("<InstanceEdit>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set readFunc(value) {
    		throw new Error("<InstanceEdit>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get saveFunc() {
    		throw new Error("<InstanceEdit>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set saveFunc(value) {
    		throw new Error("<InstanceEdit>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get deleteFunc() {
    		throw new Error("<InstanceEdit>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set deleteFunc(value) {
    		throw new Error("<InstanceEdit>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get redirect() {
    		throw new Error("<InstanceEdit>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set redirect(value) {
    		throw new Error("<InstanceEdit>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/routes/IssueEdit.svelte generated by Svelte v3.29.7 */

    function create_fragment$q(ctx) {
    	let instanceedit;
    	let current;

    	instanceedit = new InstanceEdit({
    			props: {
    				dataObject: /*issue*/ ctx[2],
    				isNew: /*params*/ ctx[0].issueId === undefined,
    				name: "Issue",
    				fields: /*fields*/ ctx[3],
    				constraints: /*constraints*/ ctx[4],
    				redirect: /*redirect*/ ctx[1],
    				readFunc: /*getIssue*/ ctx[5],
    				saveFunc: /*saveIssue*/ ctx[6],
    				deleteFunc: /*deleteIssue*/ ctx[7]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(instanceedit.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(instanceedit, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const instanceedit_changes = {};
    			if (dirty & /*params*/ 1) instanceedit_changes.isNew = /*params*/ ctx[0].issueId === undefined;
    			instanceedit.$set(instanceedit_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(instanceedit.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(instanceedit.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(instanceedit, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$q.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$q($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("IssueEdit", slots, []);
    	let { params = {} } = $$props;
    	let { projectId } = $$props;
    	let api = new Api();

    	let redirect = (issue, deleted) => {
    		if (deleted) {
    			return `#/projects/${projectId}/issues/`;
    		}

    		if (issue !== undefined) {
    			return `#/projects/${projectId}/issues/${issue.id}`;
    		}
    	}; //todo: error handling

    	let issue = {
    		title: undefined,
    		description: "",
    		closed: false
    	};

    	let fields = {
    		title: {
    			type: "text",
    			label: "Title",
    			autofocus: true
    		},
    		description: { type: "textarea", label: "Description" }
    	};

    	let constraints = {
    		title: { presence: { allowEmpty: false } }
    	};

    	onMount(() => {
    		
    	}); // console.log(params);

    	async function getIssue() {
    		return await api.getProjectIssue(projectId, params.issueId);
    	}

    	async function saveIssue(issue) {
    		return await api.saveProjectIssue(projectId, issue);
    	}

    	async function deleteIssue(issue) {
    		return await api.deleteProjectIssue(projectId, issue.id);
    	}

    	const writable_props = ["params", "projectId"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<IssueEdit> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("params" in $$props) $$invalidate(0, params = $$props.params);
    		if ("projectId" in $$props) $$invalidate(8, projectId = $$props.projectId);
    	};

    	$$self.$capture_state = () => ({
    		InstanceEdit,
    		Api,
    		onMount,
    		params,
    		projectId,
    		api,
    		redirect,
    		issue,
    		fields,
    		constraints,
    		getIssue,
    		saveIssue,
    		deleteIssue
    	});

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(0, params = $$props.params);
    		if ("projectId" in $$props) $$invalidate(8, projectId = $$props.projectId);
    		if ("api" in $$props) api = $$props.api;
    		if ("redirect" in $$props) $$invalidate(1, redirect = $$props.redirect);
    		if ("issue" in $$props) $$invalidate(2, issue = $$props.issue);
    		if ("fields" in $$props) $$invalidate(3, fields = $$props.fields);
    		if ("constraints" in $$props) $$invalidate(4, constraints = $$props.constraints);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		params,
    		redirect,
    		issue,
    		fields,
    		constraints,
    		getIssue,
    		saveIssue,
    		deleteIssue,
    		projectId
    	];
    }

    class IssueEdit extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$q, create_fragment$q, safe_not_equal, { params: 0, projectId: 8 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "IssueEdit",
    			options,
    			id: create_fragment$q.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*projectId*/ ctx[8] === undefined && !("projectId" in props)) {
    			console.warn("<IssueEdit> was created without expected prop 'projectId'");
    		}
    	}

    	get params() {
    		throw new Error("<IssueEdit>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<IssueEdit>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get projectId() {
    		throw new Error("<IssueEdit>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set projectId(value) {
    		throw new Error("<IssueEdit>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    // List of nodes to update
    const nodes = [];

    // Current location
    let location$2;

    // Function that updates all nodes marking the active ones
    function checkActive(el) {
        // Repeat this for each class
        (el.className || '').split(' ').forEach((cls) => {
            if (!cls) {
                return
            }
            // Remove the active class firsts
            el.node.classList.remove(cls);

            // If the pattern matches, then set the active class
            if (el.pattern.test(location$2)) {
                el.node.classList.add(cls);
            }
        });
    }

    // Listen to changes in the location
    loc.subscribe((value) => {
        // Update the location
        location$2 = value.location + (value.querystring ? '?' + value.querystring : '');

        // Update all nodes
        nodes.map(checkActive);
    });

    /**
     * @typedef {Object} ActiveOptions
     * @property {string|RegExp} [path] - Path expression that makes the link active when matched (must start with '/' or '*'); default is the link's href
     * @property {string} [className] - CSS class to apply to the element when active; default value is "active"
     */

    /**
     * Svelte Action for automatically adding the "active" class to elements (links, or any other DOM element) when the current location matches a certain path.
     * 
     * @param {HTMLElement} node - The target node (automatically set by Svelte)
     * @param {ActiveOptions|string|RegExp} [opts] - Can be an object of type ActiveOptions, or a string (or regular expressions) representing ActiveOptions.path.
     * @returns {{destroy: function(): void}} Destroy function
     */
    function active(node, opts) {
        // Check options
        if (opts && (typeof opts == 'string' || (typeof opts == 'object' && opts instanceof RegExp))) {
            // Interpret strings and regular expressions as opts.path
            opts = {
                path: opts
            };
        }
        else {
            // Ensure opts is a dictionary
            opts = opts || {};
        }

        // Path defaults to link target
        if (!opts.path && node.hasAttribute('href')) {
            opts.path = node.getAttribute('href');
            if (opts.path && opts.path.length > 1 && opts.path.charAt(0) == '#') {
                opts.path = opts.path.substring(1);
            }
        }

        // Default class name
        if (!opts.className) {
            opts.className = 'active';
        }

        // If path is a string, it must start with '/' or '*'
        if (!opts.path || 
            typeof opts.path == 'string' && (opts.path.length < 1 || (opts.path.charAt(0) != '/' && opts.path.charAt(0) != '*'))
        ) {
            throw Error('Invalid value for "path" argument')
        }

        // If path is not a regular expression already, make it
        const {pattern} = typeof opts.path == 'string' ?
            regexparam(opts.path) :
            {pattern: opts.path};

        // Add the node to the list
        const el = {
            node,
            className: opts.className,
            pattern
        };
        nodes.push(el);

        // Trigger the action right away
        checkActive(el);

        return {
            // When the element is destroyed, remove it from the list
            destroy() {
                nodes.splice(nodes.indexOf(el), 1);
            }
        }
    }

    /* src/c8s/NavMenu.svelte generated by Svelte v3.29.7 */
    const file$k = "src/c8s/NavMenu.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (51:20) {#if item.icon}
    function create_if_block$5(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = /*item*/ ctx[6].icon)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "w-4 mr-2");
    			attr_dev(img, "alt", "");
    			add_location(img, file$k, 51, 24, 1871);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*items*/ 2 && img.src !== (img_src_value = /*item*/ ctx[6].icon)) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(51:20) {#if item.icon}",
    		ctx
    	});

    	return block;
    }

    // (48:12) {#each items as item}
    function create_each_block$2(ctx) {
    	let a;
    	let t0;
    	let div;
    	let t1_value = /*item*/ ctx[6].title + "";
    	let t1;
    	let t2;
    	let a_href_value;
    	let link_action;
    	let active_action;
    	let mounted;
    	let dispose;
    	let if_block = /*item*/ ctx[6].icon && create_if_block$5(ctx);

    	const block = {
    		c: function create() {
    			a = element("a");
    			if (if_block) if_block.c();
    			t0 = space();
    			div = element("div");
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(div, "class", "text-md block md:inline-block hover:text-gray-600");
    			add_location(div, file$k, 53, 20, 1965);
    			attr_dev(a, "href", a_href_value = /*item*/ ctx[6].link);
    			attr_dev(a, "class", "flex p-2 items-center");
    			add_location(a, file$k, 48, 16, 1646);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			if (if_block) if_block.m(a, null);
    			append_dev(a, t0);
    			append_dev(a, div);
    			append_dev(div, t1);
    			append_dev(a, t2);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(link_action = link.call(null, a)),
    					action_destroyer(active_action = active.call(null, a, {
    						path: /*item*/ ctx[6].link,
    						className: "border-l-4 border-gray-500 bg-gray-100"
    					}))
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (/*item*/ ctx[6].icon) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$5(ctx);
    					if_block.c();
    					if_block.m(a, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*items*/ 2 && t1_value !== (t1_value = /*item*/ ctx[6].title + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*items*/ 2 && a_href_value !== (a_href_value = /*item*/ ctx[6].link)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (active_action && is_function(active_action.update) && dirty & /*items*/ 2) active_action.update.call(null, {
    				path: /*item*/ ctx[6].link,
    				className: "border-l-4 border-gray-500 bg-gray-100"
    			});
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(48:12) {#each items as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$r(ctx) {
    	let nav;
    	let div0;
    	let button;
    	let img;
    	let img_src_value;
    	let t0;
    	let div3;
    	let div1;
    	let t1;
    	let t2;
    	let div2;
    	let onClickOutside_action;
    	let mounted;
    	let dispose;
    	let each_value = /*items*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			div0 = element("div");
    			button = element("button");
    			img = element("img");
    			t0 = space();
    			div3 = element("div");
    			div1 = element("div");
    			t1 = text(/*menuTitle*/ ctx[0]);
    			t2 = space();
    			div2 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			if (img.src !== (img_src_value = "/img/menu.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "w-6 h-6");
    			attr_dev(img, "alt", "");
    			add_location(img, file$k, 34, 12, 1086);
    			attr_dev(button, "class", "flex items-center rounded hover:text-gray-600 hover:border-gray-600 focus:outline-none");
    			add_location(button, file$k, 32, 8, 916);
    			attr_dev(div0, "class", "block md:hidden");
    			add_location(div0, file$k, 31, 4, 878);
    			attr_dev(div1, "class", "px-2 py-2  text-lg border-b-2 border-gray-400");
    			add_location(div1, file$k, 45, 8, 1465);
    			attr_dev(div2, "class", "text-sm md:flex flex-col w-full");
    			add_location(div2, file$k, 46, 8, 1550);
    			attr_dev(div3, "id", "collapsible-menu");
    			attr_dev(div3, "class", "md:flex flex-col md:items-center md:w-auto\n         absolute right-0 top-0\n         md:relative md:right-auto md:top-auto\n         mt-8 md:mt-0\n         bg-white border");
    			toggle_class(div3, "hidden", /*menuHide*/ ctx[2]);
    			add_location(div3, file$k, 37, 4, 1168);
    			attr_dev(nav, "class", "flex items-center md:border-0");
    			add_location(nav, file$k, 30, 0, 811);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, div0);
    			append_dev(div0, button);
    			append_dev(button, img);
    			append_dev(nav, t0);
    			append_dev(nav, div3);
    			append_dev(div3, div1);
    			append_dev(div1, t1);
    			append_dev(div3, t2);
    			append_dev(div3, div2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", /*click_handler*/ ctx[4], false, false, false),
    					listen_dev(div3, "click", /*click_handler_1*/ ctx[5], false, false, false),
    					action_destroyer(onClickOutside_action = /*onClickOutside*/ ctx[3].call(null, nav))
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*menuTitle*/ 1) set_data_dev(t1, /*menuTitle*/ ctx[0]);

    			if (dirty & /*items*/ 2) {
    				each_value = /*items*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div2, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*menuHide*/ 4) {
    				toggle_class(div3, "hidden", /*menuHide*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$r.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$r($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("NavMenu", slots, []);
    	let { menuTitle = "Menu" } = $$props;
    	let { items = [] } = $$props;
    	let menuHide = true;

    	function onClickOutside(node) {
    		const handleClick = event => {
    			if (node && !node.contains(event.target) && !event.defaultPrevented) {
    				$$invalidate(2, menuHide = true);
    			}
    		};

    		document.addEventListener("click", handleClick, true);

    		return {
    			destroy() {
    				document.removeEventListener("click", handleClick, true);
    			}
    		};
    	}

    	const writable_props = ["menuTitle", "items"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<NavMenu> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(2, menuHide = !menuHide);
    	const click_handler_1 = () => $$invalidate(2, menuHide = true);

    	$$self.$$set = $$props => {
    		if ("menuTitle" in $$props) $$invalidate(0, menuTitle = $$props.menuTitle);
    		if ("items" in $$props) $$invalidate(1, items = $$props.items);
    	};

    	$$self.$capture_state = () => ({
    		active,
    		link,
    		menuTitle,
    		items,
    		menuHide,
    		onClickOutside
    	});

    	$$self.$inject_state = $$props => {
    		if ("menuTitle" in $$props) $$invalidate(0, menuTitle = $$props.menuTitle);
    		if ("items" in $$props) $$invalidate(1, items = $$props.items);
    		if ("menuHide" in $$props) $$invalidate(2, menuHide = $$props.menuHide);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [menuTitle, items, menuHide, onClickOutside, click_handler, click_handler_1];
    }

    class NavMenu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$r, create_fragment$r, safe_not_equal, { menuTitle: 0, items: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NavMenu",
    			options,
    			id: create_fragment$r.name
    		});
    	}

    	get menuTitle() {
    		throw new Error("<NavMenu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set menuTitle(value) {
    		throw new Error("<NavMenu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get items() {
    		throw new Error("<NavMenu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set items(value) {
    		throw new Error("<NavMenu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/routes/ProjectMembers.svelte generated by Svelte v3.29.7 */
    const file$l = "src/routes/ProjectMembers.svelte";

    // (5:0) <CenteredFlex>
    function create_default_slot$6(ctx) {
    	let div0;
    	let t1;
    	let div1;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			div0.textContent = "Members";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "Where does it come from?\n        Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin\n        literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney\n        College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and\n        going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum\n        comes from sections 1.10.32 and 1.10.33 of \"de Finibus Bonorum et Malorum\" (The Extremes of Good and Evil) by\n        Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance.\n        The first line of Lorem Ipsum, \"Lorem ipsum dolor sit amet..\", comes from a line in section 1.10.32.\n\n        The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested. Sections\n        1.10.32 and 1.10.33 from \"de Finibus Bonorum et Malorum\" by Cicero are also reproduced in their exact original\n        form, accompanied by English versions from the 1914 translation by H. Rackham.";
    			attr_dev(div0, "class", "text-lg font-bold");
    			add_location(div0, file$l, 5, 4, 97);
    			add_location(div1, file$l, 6, 4, 146);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$6.name,
    		type: "slot",
    		source: "(5:0) <CenteredFlex>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$s(ctx) {
    	let centeredflex;
    	let current;

    	centeredflex = new CenteredFlex({
    			props: {
    				$$slots: { default: [create_default_slot$6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(centeredflex.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(centeredflex, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const centeredflex_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				centeredflex_changes.$$scope = { dirty, ctx };
    			}

    			centeredflex.$set(centeredflex_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(centeredflex.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(centeredflex.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(centeredflex, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$s.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$s($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ProjectMembers", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ProjectMembers> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ CenteredFlex });
    	return [];
    }

    class ProjectMembers extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$s, create_fragment$s, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ProjectMembers",
    			options,
    			id: create_fragment$s.name
    		});
    	}
    }

    /* src/c8s/IssueCard.svelte generated by Svelte v3.29.7 */

    const file$m = "src/c8s/IssueCard.svelte";

    // (6:0) {#if issue}
    function create_if_block$6(ctx) {
    	let div2;
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let a;
    	let div0;
    	let t1_value = /*issue*/ ctx[0].title + "";
    	let t1;
    	let a_href_value;
    	let t2;
    	let if_block = /*issue*/ ctx[0].author && create_if_block_1$2(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			a = element("a");
    			div0 = element("div");
    			t1 = text(t1_value);
    			t2 = space();
    			if (if_block) if_block.c();
    			attr_dev(img, "class", "w-5 mr-2");
    			if (img.src !== (img_src_value = "/img/project.svg")) attr_dev(img, "src", img_src_value);
    			add_location(img, file$m, 8, 12, 186);
    			attr_dev(div0, "class", "text-lg");
    			add_location(div0, file$m, 10, 16, 318);
    			attr_dev(a, "href", a_href_value = "#/projects/" + /*issue*/ ctx[0].projectId + "/issues/" + /*issue*/ ctx[0].id);
    			add_location(a, file$m, 9, 12, 244);
    			attr_dev(div1, "class", "flex");
    			add_location(div1, file$m, 7, 8, 155);
    			attr_dev(div2, "class", "flex flex-col p-2 border rounded-sm w-full md:w-1/2 mb-2 mx-2 bg-gray-100");
    			add_location(div2, file$m, 6, 4, 59);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, a);
    			append_dev(a, div0);
    			append_dev(div0, t1);
    			append_dev(div2, t2);
    			if (if_block) if_block.m(div2, null);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*issue*/ 1 && t1_value !== (t1_value = /*issue*/ ctx[0].title + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*issue*/ 1 && a_href_value !== (a_href_value = "#/projects/" + /*issue*/ ctx[0].projectId + "/issues/" + /*issue*/ ctx[0].id)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (/*issue*/ ctx[0].author) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$2(ctx);
    					if_block.c();
    					if_block.m(div2, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(6:0) {#if issue}",
    		ctx
    	});

    	return block;
    }

    // (14:8) {#if issue.author}
    function create_if_block_1$2(ctx) {
    	let div;
    	let t0_value = /*issue*/ ctx[0].author.firstName + "";
    	let t0;
    	let t1;
    	let t2_value = /*issue*/ ctx[0].author.lastName + "";
    	let t2;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			t2 = text(t2_value);
    			attr_dev(div, "class", "text-sm");
    			add_location(div, file$m, 14, 12, 430);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			append_dev(div, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*issue*/ 1 && t0_value !== (t0_value = /*issue*/ ctx[0].author.firstName + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*issue*/ 1 && t2_value !== (t2_value = /*issue*/ ctx[0].author.lastName + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(14:8) {#if issue.author}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$t(ctx) {
    	let if_block_anchor;
    	let if_block = /*issue*/ ctx[0] && create_if_block$6(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*issue*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$6(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$t.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$t($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("IssueCard", slots, []);
    	let { issue } = $$props;
    	const writable_props = ["issue"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<IssueCard> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("issue" in $$props) $$invalidate(0, issue = $$props.issue);
    	};

    	$$self.$capture_state = () => ({ issue });

    	$$self.$inject_state = $$props => {
    		if ("issue" in $$props) $$invalidate(0, issue = $$props.issue);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [issue];
    }

    class IssueCard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$t, create_fragment$t, safe_not_equal, { issue: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "IssueCard",
    			options,
    			id: create_fragment$t.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*issue*/ ctx[0] === undefined && !("issue" in props)) {
    			console.warn("<IssueCard> was created without expected prop 'issue'");
    		}
    	}

    	get issue() {
    		throw new Error("<IssueCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set issue(value) {
    		throw new Error("<IssueCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/c8s/IssueList.svelte generated by Svelte v3.29.7 */

    const { console: console_1$4 } = globals;
    const file$n = "src/c8s/IssueList.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (18:0) {:else}
    function create_else_block$1(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Issues";
    			attr_dev(h1, "class", "font-bold");
    			add_location(h1, file$n, 18, 4, 446);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(18:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (16:0) {#if issues.content && issues.content.length === 0}
    function create_if_block_1$3(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "No issues yet.";
    			add_location(div, file$n, 16, 4, 408);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(16:0) {#if issues.content && issues.content.length === 0}",
    		ctx
    	});

    	return block;
    }

    // (21:0) {#if issues.content}
    function create_if_block$7(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*issues*/ ctx[0].content;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*issues*/ 1) {
    				each_value = /*issues*/ ctx[0].content;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(21:0) {#if issues.content}",
    		ctx
    	});

    	return block;
    }

    // (22:4) {#each issues.content as issue}
    function create_each_block$3(ctx) {
    	let issuecard;
    	let current;

    	issuecard = new IssueCard({
    			props: { issue: /*issue*/ ctx[2] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(issuecard.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(issuecard, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const issuecard_changes = {};
    			if (dirty & /*issues*/ 1) issuecard_changes.issue = /*issue*/ ctx[2];
    			issuecard.$set(issuecard_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(issuecard.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(issuecard.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(issuecard, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(22:4) {#each issues.content as issue}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$u(ctx) {
    	let t;
    	let if_block1_anchor;
    	let current;

    	function select_block_type(ctx, dirty) {
    		if (/*issues*/ ctx[0].content && /*issues*/ ctx[0].content.length === 0) return create_if_block_1$3;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = /*issues*/ ctx[0].content && create_if_block$7(ctx);

    	const block = {
    		c: function create() {
    			if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_block0.m(target, anchor);
    			insert_dev(target, t, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(t.parentNode, t);
    				}
    			}

    			if (/*issues*/ ctx[0].content) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*issues*/ 1) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block$7(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_block0.d(detaching);
    			if (detaching) detach_dev(t);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$u.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$u($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("IssueList", slots, []);
    	let { projectId } = $$props;
    	let issues = [];

    	onMount(async () => {
    		const api = new Api();
    		$$invalidate(0, issues = await api.getProjectIssues(projectId) || []);
    		console.log(issues);
    	});

    	const writable_props = ["projectId"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$4.warn(`<IssueList> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("projectId" in $$props) $$invalidate(1, projectId = $$props.projectId);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		Api,
    		IssueCard,
    		projectId,
    		issues
    	});

    	$$self.$inject_state = $$props => {
    		if ("projectId" in $$props) $$invalidate(1, projectId = $$props.projectId);
    		if ("issues" in $$props) $$invalidate(0, issues = $$props.issues);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [issues, projectId];
    }

    class IssueList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$u, create_fragment$u, safe_not_equal, { projectId: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "IssueList",
    			options,
    			id: create_fragment$u.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*projectId*/ ctx[1] === undefined && !("projectId" in props)) {
    			console_1$4.warn("<IssueList> was created without expected prop 'projectId'");
    		}
    	}

    	get projectId() {
    		throw new Error("<IssueList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set projectId(value) {
    		throw new Error("<IssueList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/routes/ProjectIssues.svelte generated by Svelte v3.29.7 */

    const { console: console_1$5 } = globals;
    const file$o = "src/routes/ProjectIssues.svelte";

    // (16:0) <CenteredFlex>
    function create_default_slot$7(ctx) {
    	let div;
    	let linkbutton;
    	let t;
    	let issuelist;
    	let current;

    	linkbutton = new LinkButton({
    			props: {
    				name: "New Issue",
    				href: "#/projects/" + /*projectId*/ ctx[0] + "/issues/new",
    				defaultAction: "true"
    			},
    			$$inline: true
    		});

    	issuelist = new IssueList({
    			props: { projectId: /*projectId*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(linkbutton.$$.fragment);
    			t = space();
    			create_component(issuelist.$$.fragment);
    			attr_dev(div, "class", "mb-4");
    			add_location(div, file$o, 16, 4, 346);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(linkbutton, div, null);
    			insert_dev(target, t, anchor);
    			mount_component(issuelist, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const linkbutton_changes = {};
    			if (dirty & /*projectId*/ 1) linkbutton_changes.href = "#/projects/" + /*projectId*/ ctx[0] + "/issues/new";
    			linkbutton.$set(linkbutton_changes);
    			const issuelist_changes = {};
    			if (dirty & /*projectId*/ 1) issuelist_changes.projectId = /*projectId*/ ctx[0];
    			issuelist.$set(issuelist_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(linkbutton.$$.fragment, local);
    			transition_in(issuelist.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(linkbutton.$$.fragment, local);
    			transition_out(issuelist.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(linkbutton);
    			if (detaching) detach_dev(t);
    			destroy_component(issuelist, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$7.name,
    		type: "slot",
    		source: "(16:0) <CenteredFlex>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$v(ctx) {
    	let centeredflex;
    	let current;

    	centeredflex = new CenteredFlex({
    			props: {
    				$$slots: { default: [create_default_slot$7] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(centeredflex.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(centeredflex, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const centeredflex_changes = {};

    			if (dirty & /*$$scope, projectId*/ 5) {
    				centeredflex_changes.$$scope = { dirty, ctx };
    			}

    			centeredflex.$set(centeredflex_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(centeredflex.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(centeredflex.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(centeredflex, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$v.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$v($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ProjectIssues", slots, []);
    	let { projectId } = $$props;
    	let { params } = $$props;

    	onMount(() => {
    		console.log(params);
    	});

    	const writable_props = ["projectId", "params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$5.warn(`<ProjectIssues> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("projectId" in $$props) $$invalidate(0, projectId = $$props.projectId);
    		if ("params" in $$props) $$invalidate(1, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({
    		CenteredFlex,
    		IssueList,
    		LinkButton,
    		onMount,
    		projectId,
    		params
    	});

    	$$self.$inject_state = $$props => {
    		if ("projectId" in $$props) $$invalidate(0, projectId = $$props.projectId);
    		if ("params" in $$props) $$invalidate(1, params = $$props.params);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [projectId, params];
    }

    class ProjectIssues extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$v, create_fragment$v, safe_not_equal, { projectId: 0, params: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ProjectIssues",
    			options,
    			id: create_fragment$v.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*projectId*/ ctx[0] === undefined && !("projectId" in props)) {
    			console_1$5.warn("<ProjectIssues> was created without expected prop 'projectId'");
    		}

    		if (/*params*/ ctx[1] === undefined && !("params" in props)) {
    			console_1$5.warn("<ProjectIssues> was created without expected prop 'params'");
    		}
    	}

    	get projectId() {
    		throw new Error("<ProjectIssues>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set projectId(value) {
    		throw new Error("<ProjectIssues>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get params() {
    		throw new Error("<ProjectIssues>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<ProjectIssues>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var marked = createCommonjsModule(function (module, exports) {
    /**
     * marked - a markdown parser
     * Copyright (c) 2011-2021, Christopher Jeffrey. (MIT Licensed)
     * https://github.com/markedjs/marked
     */

    /**
     * DO NOT EDIT THIS FILE
     * The code in this file is generated from files in ./src/
     */

    (function (global, factory) {
       module.exports = factory() ;
    }(commonjsGlobal, (function () {
      function _defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
          var descriptor = props[i];
          descriptor.enumerable = descriptor.enumerable || false;
          descriptor.configurable = true;
          if ("value" in descriptor) descriptor.writable = true;
          Object.defineProperty(target, descriptor.key, descriptor);
        }
      }

      function _createClass(Constructor, protoProps, staticProps) {
        if (protoProps) _defineProperties(Constructor.prototype, protoProps);
        if (staticProps) _defineProperties(Constructor, staticProps);
        return Constructor;
      }

      function _unsupportedIterableToArray(o, minLen) {
        if (!o) return;
        if (typeof o === "string") return _arrayLikeToArray(o, minLen);
        var n = Object.prototype.toString.call(o).slice(8, -1);
        if (n === "Object" && o.constructor) n = o.constructor.name;
        if (n === "Map" || n === "Set") return Array.from(o);
        if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
      }

      function _arrayLikeToArray(arr, len) {
        if (len == null || len > arr.length) len = arr.length;

        for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

        return arr2;
      }

      function _createForOfIteratorHelperLoose(o, allowArrayLike) {
        var it;

        if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) {
          if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
            if (it) o = it;
            var i = 0;
            return function () {
              if (i >= o.length) return {
                done: true
              };
              return {
                done: false,
                value: o[i++]
              };
            };
          }

          throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
        }

        it = o[Symbol.iterator]();
        return it.next.bind(it);
      }

      function createCommonjsModule(fn) {
        var module = { exports: {} };
      	return fn(module, module.exports), module.exports;
      }

      var defaults = createCommonjsModule(function (module) {
        function getDefaults() {
          return {
            baseUrl: null,
            breaks: false,
            gfm: true,
            headerIds: true,
            headerPrefix: '',
            highlight: null,
            langPrefix: 'language-',
            mangle: true,
            pedantic: false,
            renderer: null,
            sanitize: false,
            sanitizer: null,
            silent: false,
            smartLists: false,
            smartypants: false,
            tokenizer: null,
            walkTokens: null,
            xhtml: false
          };
        }

        function changeDefaults(newDefaults) {
          module.exports.defaults = newDefaults;
        }

        module.exports = {
          defaults: getDefaults(),
          getDefaults: getDefaults,
          changeDefaults: changeDefaults
        };
      });

      /**
       * Helpers
       */
      var escapeTest = /[&<>"']/;
      var escapeReplace = /[&<>"']/g;
      var escapeTestNoEncode = /[<>"']|&(?!#?\w+;)/;
      var escapeReplaceNoEncode = /[<>"']|&(?!#?\w+;)/g;
      var escapeReplacements = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      };

      var getEscapeReplacement = function getEscapeReplacement(ch) {
        return escapeReplacements[ch];
      };

      function escape(html, encode) {
        if (encode) {
          if (escapeTest.test(html)) {
            return html.replace(escapeReplace, getEscapeReplacement);
          }
        } else {
          if (escapeTestNoEncode.test(html)) {
            return html.replace(escapeReplaceNoEncode, getEscapeReplacement);
          }
        }

        return html;
      }

      var unescapeTest = /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig;

      function unescape(html) {
        // explicitly match decimal, hex, and named HTML entities
        return html.replace(unescapeTest, function (_, n) {
          n = n.toLowerCase();
          if (n === 'colon') return ':';

          if (n.charAt(0) === '#') {
            return n.charAt(1) === 'x' ? String.fromCharCode(parseInt(n.substring(2), 16)) : String.fromCharCode(+n.substring(1));
          }

          return '';
        });
      }

      var caret = /(^|[^\[])\^/g;

      function edit(regex, opt) {
        regex = regex.source || regex;
        opt = opt || '';
        var obj = {
          replace: function replace(name, val) {
            val = val.source || val;
            val = val.replace(caret, '$1');
            regex = regex.replace(name, val);
            return obj;
          },
          getRegex: function getRegex() {
            return new RegExp(regex, opt);
          }
        };
        return obj;
      }

      var nonWordAndColonTest = /[^\w:]/g;
      var originIndependentUrl = /^$|^[a-z][a-z0-9+.-]*:|^[?#]/i;

      function cleanUrl(sanitize, base, href) {
        if (sanitize) {
          var prot;

          try {
            prot = decodeURIComponent(unescape(href)).replace(nonWordAndColonTest, '').toLowerCase();
          } catch (e) {
            return null;
          }

          if (prot.indexOf('javascript:') === 0 || prot.indexOf('vbscript:') === 0 || prot.indexOf('data:') === 0) {
            return null;
          }
        }

        if (base && !originIndependentUrl.test(href)) {
          href = resolveUrl(base, href);
        }

        try {
          href = encodeURI(href).replace(/%25/g, '%');
        } catch (e) {
          return null;
        }

        return href;
      }

      var baseUrls = {};
      var justDomain = /^[^:]+:\/*[^/]*$/;
      var protocol = /^([^:]+:)[\s\S]*$/;
      var domain = /^([^:]+:\/*[^/]*)[\s\S]*$/;

      function resolveUrl(base, href) {
        if (!baseUrls[' ' + base]) {
          // we can ignore everything in base after the last slash of its path component,
          // but we might need to add _that_
          // https://tools.ietf.org/html/rfc3986#section-3
          if (justDomain.test(base)) {
            baseUrls[' ' + base] = base + '/';
          } else {
            baseUrls[' ' + base] = rtrim(base, '/', true);
          }
        }

        base = baseUrls[' ' + base];
        var relativeBase = base.indexOf(':') === -1;

        if (href.substring(0, 2) === '//') {
          if (relativeBase) {
            return href;
          }

          return base.replace(protocol, '$1') + href;
        } else if (href.charAt(0) === '/') {
          if (relativeBase) {
            return href;
          }

          return base.replace(domain, '$1') + href;
        } else {
          return base + href;
        }
      }

      var noopTest = {
        exec: function noopTest() {}
      };

      function merge(obj) {
        var i = 1,
            target,
            key;

        for (; i < arguments.length; i++) {
          target = arguments[i];

          for (key in target) {
            if (Object.prototype.hasOwnProperty.call(target, key)) {
              obj[key] = target[key];
            }
          }
        }

        return obj;
      }

      function splitCells(tableRow, count) {
        // ensure that every cell-delimiting pipe has a space
        // before it to distinguish it from an escaped pipe
        var row = tableRow.replace(/\|/g, function (match, offset, str) {
          var escaped = false,
              curr = offset;

          while (--curr >= 0 && str[curr] === '\\') {
            escaped = !escaped;
          }

          if (escaped) {
            // odd number of slashes means | is escaped
            // so we leave it alone
            return '|';
          } else {
            // add space before unescaped |
            return ' |';
          }
        }),
            cells = row.split(/ \|/);
        var i = 0;

        if (cells.length > count) {
          cells.splice(count);
        } else {
          while (cells.length < count) {
            cells.push('');
          }
        }

        for (; i < cells.length; i++) {
          // leading or trailing whitespace is ignored per the gfm spec
          cells[i] = cells[i].trim().replace(/\\\|/g, '|');
        }

        return cells;
      } // Remove trailing 'c's. Equivalent to str.replace(/c*$/, '').
      // /c*$/ is vulnerable to REDOS.
      // invert: Remove suffix of non-c chars instead. Default falsey.


      function rtrim(str, c, invert) {
        var l = str.length;

        if (l === 0) {
          return '';
        } // Length of suffix matching the invert condition.


        var suffLen = 0; // Step left until we fail to match the invert condition.

        while (suffLen < l) {
          var currChar = str.charAt(l - suffLen - 1);

          if (currChar === c && !invert) {
            suffLen++;
          } else if (currChar !== c && invert) {
            suffLen++;
          } else {
            break;
          }
        }

        return str.substr(0, l - suffLen);
      }

      function findClosingBracket(str, b) {
        if (str.indexOf(b[1]) === -1) {
          return -1;
        }

        var l = str.length;
        var level = 0,
            i = 0;

        for (; i < l; i++) {
          if (str[i] === '\\') {
            i++;
          } else if (str[i] === b[0]) {
            level++;
          } else if (str[i] === b[1]) {
            level--;

            if (level < 0) {
              return i;
            }
          }
        }

        return -1;
      }

      function checkSanitizeDeprecation(opt) {
        if (opt && opt.sanitize && !opt.silent) {
          console.warn('marked(): sanitize and sanitizer parameters are deprecated since version 0.7.0, should not be used and will be removed in the future. Read more here: https://marked.js.org/#/USING_ADVANCED.md#options');
        }
      } // copied from https://stackoverflow.com/a/5450113/806777


      function repeatString(pattern, count) {
        if (count < 1) {
          return '';
        }

        var result = '';

        while (count > 1) {
          if (count & 1) {
            result += pattern;
          }

          count >>= 1;
          pattern += pattern;
        }

        return result + pattern;
      }

      var helpers = {
        escape: escape,
        unescape: unescape,
        edit: edit,
        cleanUrl: cleanUrl,
        resolveUrl: resolveUrl,
        noopTest: noopTest,
        merge: merge,
        splitCells: splitCells,
        rtrim: rtrim,
        findClosingBracket: findClosingBracket,
        checkSanitizeDeprecation: checkSanitizeDeprecation,
        repeatString: repeatString
      };

      var defaults$1 = defaults.defaults;
      var rtrim$1 = helpers.rtrim,
          splitCells$1 = helpers.splitCells,
          _escape = helpers.escape,
          findClosingBracket$1 = helpers.findClosingBracket;

      function outputLink(cap, link, raw) {
        var href = link.href;
        var title = link.title ? _escape(link.title) : null;
        var text = cap[1].replace(/\\([\[\]])/g, '$1');

        if (cap[0].charAt(0) !== '!') {
          return {
            type: 'link',
            raw: raw,
            href: href,
            title: title,
            text: text
          };
        } else {
          return {
            type: 'image',
            raw: raw,
            href: href,
            title: title,
            text: _escape(text)
          };
        }
      }

      function indentCodeCompensation(raw, text) {
        var matchIndentToCode = raw.match(/^(\s+)(?:```)/);

        if (matchIndentToCode === null) {
          return text;
        }

        var indentToCode = matchIndentToCode[1];
        return text.split('\n').map(function (node) {
          var matchIndentInNode = node.match(/^\s+/);

          if (matchIndentInNode === null) {
            return node;
          }

          var indentInNode = matchIndentInNode[0];

          if (indentInNode.length >= indentToCode.length) {
            return node.slice(indentToCode.length);
          }

          return node;
        }).join('\n');
      }
      /**
       * Tokenizer
       */


      var Tokenizer_1 = /*#__PURE__*/function () {
        function Tokenizer(options) {
          this.options = options || defaults$1;
        }

        var _proto = Tokenizer.prototype;

        _proto.space = function space(src) {
          var cap = this.rules.block.newline.exec(src);

          if (cap) {
            if (cap[0].length > 1) {
              return {
                type: 'space',
                raw: cap[0]
              };
            }

            return {
              raw: '\n'
            };
          }
        };

        _proto.code = function code(src) {
          var cap = this.rules.block.code.exec(src);

          if (cap) {
            var text = cap[0].replace(/^ {1,4}/gm, '');
            return {
              type: 'code',
              raw: cap[0],
              codeBlockStyle: 'indented',
              text: !this.options.pedantic ? rtrim$1(text, '\n') : text
            };
          }
        };

        _proto.fences = function fences(src) {
          var cap = this.rules.block.fences.exec(src);

          if (cap) {
            var raw = cap[0];
            var text = indentCodeCompensation(raw, cap[3] || '');
            return {
              type: 'code',
              raw: raw,
              lang: cap[2] ? cap[2].trim() : cap[2],
              text: text
            };
          }
        };

        _proto.heading = function heading(src) {
          var cap = this.rules.block.heading.exec(src);

          if (cap) {
            var text = cap[2].trim(); // remove trailing #s

            if (/#$/.test(text)) {
              var trimmed = rtrim$1(text, '#');

              if (this.options.pedantic) {
                text = trimmed.trim();
              } else if (!trimmed || / $/.test(trimmed)) {
                // CommonMark requires space before trailing #s
                text = trimmed.trim();
              }
            }

            return {
              type: 'heading',
              raw: cap[0],
              depth: cap[1].length,
              text: text
            };
          }
        };

        _proto.nptable = function nptable(src) {
          var cap = this.rules.block.nptable.exec(src);

          if (cap) {
            var item = {
              type: 'table',
              header: splitCells$1(cap[1].replace(/^ *| *\| *$/g, '')),
              align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
              cells: cap[3] ? cap[3].replace(/\n$/, '').split('\n') : [],
              raw: cap[0]
            };

            if (item.header.length === item.align.length) {
              var l = item.align.length;
              var i;

              for (i = 0; i < l; i++) {
                if (/^ *-+: *$/.test(item.align[i])) {
                  item.align[i] = 'right';
                } else if (/^ *:-+: *$/.test(item.align[i])) {
                  item.align[i] = 'center';
                } else if (/^ *:-+ *$/.test(item.align[i])) {
                  item.align[i] = 'left';
                } else {
                  item.align[i] = null;
                }
              }

              l = item.cells.length;

              for (i = 0; i < l; i++) {
                item.cells[i] = splitCells$1(item.cells[i], item.header.length);
              }

              return item;
            }
          }
        };

        _proto.hr = function hr(src) {
          var cap = this.rules.block.hr.exec(src);

          if (cap) {
            return {
              type: 'hr',
              raw: cap[0]
            };
          }
        };

        _proto.blockquote = function blockquote(src) {
          var cap = this.rules.block.blockquote.exec(src);

          if (cap) {
            var text = cap[0].replace(/^ *> ?/gm, '');
            return {
              type: 'blockquote',
              raw: cap[0],
              text: text
            };
          }
        };

        _proto.list = function list(src) {
          var cap = this.rules.block.list.exec(src);

          if (cap) {
            var raw = cap[0];
            var bull = cap[2];
            var isordered = bull.length > 1;
            var list = {
              type: 'list',
              raw: raw,
              ordered: isordered,
              start: isordered ? +bull.slice(0, -1) : '',
              loose: false,
              items: []
            }; // Get each top-level item.

            var itemMatch = cap[0].match(this.rules.block.item);
            var next = false,
                item,
                space,
                bcurr,
                bnext,
                addBack,
                loose,
                istask,
                ischecked;
            var l = itemMatch.length;
            bcurr = this.rules.block.listItemStart.exec(itemMatch[0]);

            for (var i = 0; i < l; i++) {
              item = itemMatch[i];
              raw = item; // Determine whether the next list item belongs here.
              // Backpedal if it does not belong in this list.

              if (i !== l - 1) {
                bnext = this.rules.block.listItemStart.exec(itemMatch[i + 1]);

                if (!this.options.pedantic ? bnext[1].length > bcurr[0].length || bnext[1].length > 3 : bnext[1].length > bcurr[1].length) {
                  // nested list
                  itemMatch.splice(i, 2, itemMatch[i] + '\n' + itemMatch[i + 1]);
                  i--;
                  l--;
                  continue;
                } else {
                  if ( // different bullet style
                  !this.options.pedantic || this.options.smartLists ? bnext[2][bnext[2].length - 1] !== bull[bull.length - 1] : isordered === (bnext[2].length === 1)) {
                    addBack = itemMatch.slice(i + 1).join('\n');
                    list.raw = list.raw.substring(0, list.raw.length - addBack.length);
                    i = l - 1;
                  }
                }

                bcurr = bnext;
              } // Remove the list item's bullet
              // so it is seen as the next token.


              space = item.length;
              item = item.replace(/^ *([*+-]|\d+[.)]) ?/, ''); // Outdent whatever the
              // list item contains. Hacky.

              if (~item.indexOf('\n ')) {
                space -= item.length;
                item = !this.options.pedantic ? item.replace(new RegExp('^ {1,' + space + '}', 'gm'), '') : item.replace(/^ {1,4}/gm, '');
              } // Determine whether item is loose or not.
              // Use: /(^|\n)(?! )[^\n]+\n\n(?!\s*$)/
              // for discount behavior.


              loose = next || /\n\n(?!\s*$)/.test(item);

              if (i !== l - 1) {
                next = item.charAt(item.length - 1) === '\n';
                if (!loose) loose = next;
              }

              if (loose) {
                list.loose = true;
              } // Check for task list items


              if (this.options.gfm) {
                istask = /^\[[ xX]\] /.test(item);
                ischecked = undefined;

                if (istask) {
                  ischecked = item[1] !== ' ';
                  item = item.replace(/^\[[ xX]\] +/, '');
                }
              }

              list.items.push({
                type: 'list_item',
                raw: raw,
                task: istask,
                checked: ischecked,
                loose: loose,
                text: item
              });
            }

            return list;
          }
        };

        _proto.html = function html(src) {
          var cap = this.rules.block.html.exec(src);

          if (cap) {
            return {
              type: this.options.sanitize ? 'paragraph' : 'html',
              raw: cap[0],
              pre: !this.options.sanitizer && (cap[1] === 'pre' || cap[1] === 'script' || cap[1] === 'style'),
              text: this.options.sanitize ? this.options.sanitizer ? this.options.sanitizer(cap[0]) : _escape(cap[0]) : cap[0]
            };
          }
        };

        _proto.def = function def(src) {
          var cap = this.rules.block.def.exec(src);

          if (cap) {
            if (cap[3]) cap[3] = cap[3].substring(1, cap[3].length - 1);
            var tag = cap[1].toLowerCase().replace(/\s+/g, ' ');
            return {
              tag: tag,
              raw: cap[0],
              href: cap[2],
              title: cap[3]
            };
          }
        };

        _proto.table = function table(src) {
          var cap = this.rules.block.table.exec(src);

          if (cap) {
            var item = {
              type: 'table',
              header: splitCells$1(cap[1].replace(/^ *| *\| *$/g, '')),
              align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
              cells: cap[3] ? cap[3].replace(/\n$/, '').split('\n') : []
            };

            if (item.header.length === item.align.length) {
              item.raw = cap[0];
              var l = item.align.length;
              var i;

              for (i = 0; i < l; i++) {
                if (/^ *-+: *$/.test(item.align[i])) {
                  item.align[i] = 'right';
                } else if (/^ *:-+: *$/.test(item.align[i])) {
                  item.align[i] = 'center';
                } else if (/^ *:-+ *$/.test(item.align[i])) {
                  item.align[i] = 'left';
                } else {
                  item.align[i] = null;
                }
              }

              l = item.cells.length;

              for (i = 0; i < l; i++) {
                item.cells[i] = splitCells$1(item.cells[i].replace(/^ *\| *| *\| *$/g, ''), item.header.length);
              }

              return item;
            }
          }
        };

        _proto.lheading = function lheading(src) {
          var cap = this.rules.block.lheading.exec(src);

          if (cap) {
            return {
              type: 'heading',
              raw: cap[0],
              depth: cap[2].charAt(0) === '=' ? 1 : 2,
              text: cap[1]
            };
          }
        };

        _proto.paragraph = function paragraph(src) {
          var cap = this.rules.block.paragraph.exec(src);

          if (cap) {
            return {
              type: 'paragraph',
              raw: cap[0],
              text: cap[1].charAt(cap[1].length - 1) === '\n' ? cap[1].slice(0, -1) : cap[1]
            };
          }
        };

        _proto.text = function text(src) {
          var cap = this.rules.block.text.exec(src);

          if (cap) {
            return {
              type: 'text',
              raw: cap[0],
              text: cap[0]
            };
          }
        };

        _proto.escape = function escape(src) {
          var cap = this.rules.inline.escape.exec(src);

          if (cap) {
            return {
              type: 'escape',
              raw: cap[0],
              text: _escape(cap[1])
            };
          }
        };

        _proto.tag = function tag(src, inLink, inRawBlock) {
          var cap = this.rules.inline.tag.exec(src);

          if (cap) {
            if (!inLink && /^<a /i.test(cap[0])) {
              inLink = true;
            } else if (inLink && /^<\/a>/i.test(cap[0])) {
              inLink = false;
            }

            if (!inRawBlock && /^<(pre|code|kbd|script)(\s|>)/i.test(cap[0])) {
              inRawBlock = true;
            } else if (inRawBlock && /^<\/(pre|code|kbd|script)(\s|>)/i.test(cap[0])) {
              inRawBlock = false;
            }

            return {
              type: this.options.sanitize ? 'text' : 'html',
              raw: cap[0],
              inLink: inLink,
              inRawBlock: inRawBlock,
              text: this.options.sanitize ? this.options.sanitizer ? this.options.sanitizer(cap[0]) : _escape(cap[0]) : cap[0]
            };
          }
        };

        _proto.link = function link(src) {
          var cap = this.rules.inline.link.exec(src);

          if (cap) {
            var trimmedUrl = cap[2].trim();

            if (!this.options.pedantic && /^</.test(trimmedUrl)) {
              // commonmark requires matching angle brackets
              if (!/>$/.test(trimmedUrl)) {
                return;
              } // ending angle bracket cannot be escaped


              var rtrimSlash = rtrim$1(trimmedUrl.slice(0, -1), '\\');

              if ((trimmedUrl.length - rtrimSlash.length) % 2 === 0) {
                return;
              }
            } else {
              // find closing parenthesis
              var lastParenIndex = findClosingBracket$1(cap[2], '()');

              if (lastParenIndex > -1) {
                var start = cap[0].indexOf('!') === 0 ? 5 : 4;
                var linkLen = start + cap[1].length + lastParenIndex;
                cap[2] = cap[2].substring(0, lastParenIndex);
                cap[0] = cap[0].substring(0, linkLen).trim();
                cap[3] = '';
              }
            }

            var href = cap[2];
            var title = '';

            if (this.options.pedantic) {
              // split pedantic href and title
              var link = /^([^'"]*[^\s])\s+(['"])(.*)\2/.exec(href);

              if (link) {
                href = link[1];
                title = link[3];
              }
            } else {
              title = cap[3] ? cap[3].slice(1, -1) : '';
            }

            href = href.trim();

            if (/^</.test(href)) {
              if (this.options.pedantic && !/>$/.test(trimmedUrl)) {
                // pedantic allows starting angle bracket without ending angle bracket
                href = href.slice(1);
              } else {
                href = href.slice(1, -1);
              }
            }

            return outputLink(cap, {
              href: href ? href.replace(this.rules.inline._escapes, '$1') : href,
              title: title ? title.replace(this.rules.inline._escapes, '$1') : title
            }, cap[0]);
          }
        };

        _proto.reflink = function reflink(src, links) {
          var cap;

          if ((cap = this.rules.inline.reflink.exec(src)) || (cap = this.rules.inline.nolink.exec(src))) {
            var link = (cap[2] || cap[1]).replace(/\s+/g, ' ');
            link = links[link.toLowerCase()];

            if (!link || !link.href) {
              var text = cap[0].charAt(0);
              return {
                type: 'text',
                raw: text,
                text: text
              };
            }

            return outputLink(cap, link, cap[0]);
          }
        };

        _proto.emStrong = function emStrong(src, maskedSrc, prevChar) {
          if (prevChar === void 0) {
            prevChar = '';
          }

          var match = this.rules.inline.emStrong.lDelim.exec(src);
          if (!match) return;
          if (match[3] && prevChar.match(/(?:[0-9A-Za-z\xAA\xB2\xB3\xB5\xB9\xBA\xBC-\xBE\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0560-\u0588\u05D0-\u05EA\u05EF-\u05F2\u0620-\u064A\u0660-\u0669\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07C0-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u0860-\u086A\u08A0-\u08B4\u08B6-\u08C7\u0904-\u0939\u093D\u0950\u0958-\u0961\u0966-\u096F\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09E6-\u09F1\u09F4-\u09F9\u09FC\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A66-\u0A6F\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AE6-\u0AEF\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B66-\u0B6F\u0B71-\u0B77\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0BE6-\u0BF2\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C66-\u0C6F\u0C78-\u0C7E\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CE6-\u0CEF\u0CF1\u0CF2\u0D04-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D58-\u0D61\u0D66-\u0D78\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DE6-\u0DEF\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E86-\u0E8A\u0E8C-\u0EA3\u0EA5\u0EA7-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F20-\u0F33\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F-\u1049\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u1090-\u1099\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1369-\u137C\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u17E0-\u17E9\u17F0-\u17F9\u1810-\u1819\u1820-\u1878\u1880-\u1884\u1887-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19DA\u1A00-\u1A16\u1A20-\u1A54\u1A80-\u1A89\u1A90-\u1A99\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B50-\u1B59\u1B83-\u1BA0\u1BAE-\u1BE5\u1C00-\u1C23\u1C40-\u1C49\u1C4D-\u1C7D\u1C80-\u1C88\u1C90-\u1CBA\u1CBD-\u1CBF\u1CE9-\u1CEC\u1CEE-\u1CF3\u1CF5\u1CF6\u1CFA\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2070\u2071\u2074-\u2079\u207F-\u2089\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2150-\u2189\u2460-\u249B\u24EA-\u24FF\u2776-\u2793\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2CFD\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312F\u3131-\u318E\u3192-\u3195\u31A0-\u31BF\u31F0-\u31FF\u3220-\u3229\u3248-\u324F\u3251-\u325F\u3280-\u3289\u32B1-\u32BF\u3400-\u4DBF\u4E00-\u9FFC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7BF\uA7C2-\uA7CA\uA7F5-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA830-\uA835\uA840-\uA873\uA882-\uA8B3\uA8D0-\uA8D9\uA8F2-\uA8F7\uA8FB\uA8FD\uA8FE\uA900-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF-\uA9D9\uA9E0-\uA9E4\uA9E6-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA50-\uAA59\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB69\uAB70-\uABE2\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD07-\uDD33\uDD40-\uDD78\uDD8A\uDD8B\uDE80-\uDE9C\uDEA0-\uDED0\uDEE1-\uDEFB\uDF00-\uDF23\uDF2D-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC58-\uDC76\uDC79-\uDC9E\uDCA7-\uDCAF\uDCE0-\uDCF2\uDCF4\uDCF5\uDCFB-\uDD1B\uDD20-\uDD39\uDD80-\uDDB7\uDDBC-\uDDCF\uDDD2-\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE35\uDE40-\uDE48\uDE60-\uDE7E\uDE80-\uDE9F\uDEC0-\uDEC7\uDEC9-\uDEE4\uDEEB-\uDEEF\uDF00-\uDF35\uDF40-\uDF55\uDF58-\uDF72\uDF78-\uDF91\uDFA9-\uDFAF]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2\uDCFA-\uDD23\uDD30-\uDD39\uDE60-\uDE7E\uDE80-\uDEA9\uDEB0\uDEB1\uDF00-\uDF27\uDF30-\uDF45\uDF51-\uDF54\uDFB0-\uDFCB\uDFE0-\uDFF6]|\uD804[\uDC03-\uDC37\uDC52-\uDC6F\uDC83-\uDCAF\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD03-\uDD26\uDD36-\uDD3F\uDD44\uDD47\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDD0-\uDDDA\uDDDC\uDDE1-\uDDF4\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDEF0-\uDEF9\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC00-\uDC34\uDC47-\uDC4A\uDC50-\uDC59\uDC5F-\uDC61\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE50-\uDE59\uDE80-\uDEAA\uDEB8\uDEC0-\uDEC9\uDF00-\uDF1A\uDF30-\uDF3B]|\uD806[\uDC00-\uDC2B\uDCA0-\uDCF2\uDCFF-\uDD06\uDD09\uDD0C-\uDD13\uDD15\uDD16\uDD18-\uDD2F\uDD3F\uDD41\uDD50-\uDD59\uDDA0-\uDDA7\uDDAA-\uDDD0\uDDE1\uDDE3\uDE00\uDE0B-\uDE32\uDE3A\uDE50\uDE5C-\uDE89\uDE9D\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC2E\uDC40\uDC50-\uDC6C\uDC72-\uDC8F\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD30\uDD46\uDD50-\uDD59\uDD60-\uDD65\uDD67\uDD68\uDD6A-\uDD89\uDD98\uDDA0-\uDDA9\uDEE0-\uDEF2\uDFB0\uDFC0-\uDFD4]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD822\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879\uD880-\uD883][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF50-\uDF59\uDF5B-\uDF61\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDE40-\uDE96\uDF00-\uDF4A\uDF50\uDF93-\uDF9F\uDFE0\uDFE1\uDFE3]|\uD821[\uDC00-\uDFF7]|\uD823[\uDC00-\uDCD5\uDD00-\uDD08]|\uD82C[\uDC00-\uDD1E\uDD50-\uDD52\uDD64-\uDD67\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD834[\uDEE0-\uDEF3\uDF60-\uDF78]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD838[\uDD00-\uDD2C\uDD37-\uDD3D\uDD40-\uDD49\uDD4E\uDEC0-\uDEEB\uDEF0-\uDEF9]|\uD83A[\uDC00-\uDCC4\uDCC7-\uDCCF\uDD00-\uDD43\uDD4B\uDD50-\uDD59]|\uD83B[\uDC71-\uDCAB\uDCAD-\uDCAF\uDCB1-\uDCB4\uDD01-\uDD2D\uDD2F-\uDD3D\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD83C[\uDD00-\uDD0C]|\uD83E[\uDFF0-\uDFF9]|\uD869[\uDC00-\uDEDD\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]|\uD884[\uDC00-\uDF4A])/)) return; // _ can't be between two alphanumerics. \p{L}\p{N} includes non-english alphabet/numbers as well

          var nextChar = match[1] || match[2] || '';

          if (!nextChar || nextChar && (prevChar === '' || this.rules.inline.punctuation.exec(prevChar))) {
            var lLength = match[0].length - 1;
            var rDelim,
                rLength,
                delimTotal = lLength,
                midDelimTotal = 0;
            var endReg = match[0][0] === '*' ? this.rules.inline.emStrong.rDelimAst : this.rules.inline.emStrong.rDelimUnd;
            endReg.lastIndex = 0;
            maskedSrc = maskedSrc.slice(-1 * src.length + lLength); // Bump maskedSrc to same section of string as src (move to lexer?)

            while ((match = endReg.exec(maskedSrc)) != null) {
              rDelim = match[1] || match[2] || match[3] || match[4] || match[5] || match[6];
              if (!rDelim) continue; // matched the first alternative in rules.js (skip the * in __abc*abc__)

              rLength = rDelim.length;

              if (match[3] || match[4]) {
                // found another Left Delim
                delimTotal += rLength;
                continue;
              } else if (match[5] || match[6]) {
                // either Left or Right Delim
                if (lLength % 3 && !((lLength + rLength) % 3)) {
                  midDelimTotal += rLength;
                  continue; // CommonMark Emphasis Rules 9-10
                }
              }

              delimTotal -= rLength;
              if (delimTotal > 0) continue; // Haven't found enough closing delimiters
              // If this is the last rDelimiter, remove extra characters. *a*** -> *a*

              if (delimTotal + midDelimTotal - rLength <= 0 && !maskedSrc.slice(endReg.lastIndex).match(endReg)) {
                rLength = Math.min(rLength, rLength + delimTotal + midDelimTotal);
              }

              if (Math.min(lLength, rLength) % 2) {
                return {
                  type: 'em',
                  raw: src.slice(0, lLength + match.index + rLength + 1),
                  text: src.slice(1, lLength + match.index + rLength)
                };
              }

              if (Math.min(lLength, rLength) % 2 === 0) {
                return {
                  type: 'strong',
                  raw: src.slice(0, lLength + match.index + rLength + 1),
                  text: src.slice(2, lLength + match.index + rLength - 1)
                };
              }
            }
          }
        };

        _proto.codespan = function codespan(src) {
          var cap = this.rules.inline.code.exec(src);

          if (cap) {
            var text = cap[2].replace(/\n/g, ' ');
            var hasNonSpaceChars = /[^ ]/.test(text);
            var hasSpaceCharsOnBothEnds = /^ /.test(text) && / $/.test(text);

            if (hasNonSpaceChars && hasSpaceCharsOnBothEnds) {
              text = text.substring(1, text.length - 1);
            }

            text = _escape(text, true);
            return {
              type: 'codespan',
              raw: cap[0],
              text: text
            };
          }
        };

        _proto.br = function br(src) {
          var cap = this.rules.inline.br.exec(src);

          if (cap) {
            return {
              type: 'br',
              raw: cap[0]
            };
          }
        };

        _proto.del = function del(src) {
          var cap = this.rules.inline.del.exec(src);

          if (cap) {
            return {
              type: 'del',
              raw: cap[0],
              text: cap[2]
            };
          }
        };

        _proto.autolink = function autolink(src, mangle) {
          var cap = this.rules.inline.autolink.exec(src);

          if (cap) {
            var text, href;

            if (cap[2] === '@') {
              text = _escape(this.options.mangle ? mangle(cap[1]) : cap[1]);
              href = 'mailto:' + text;
            } else {
              text = _escape(cap[1]);
              href = text;
            }

            return {
              type: 'link',
              raw: cap[0],
              text: text,
              href: href,
              tokens: [{
                type: 'text',
                raw: text,
                text: text
              }]
            };
          }
        };

        _proto.url = function url(src, mangle) {
          var cap;

          if (cap = this.rules.inline.url.exec(src)) {
            var text, href;

            if (cap[2] === '@') {
              text = _escape(this.options.mangle ? mangle(cap[0]) : cap[0]);
              href = 'mailto:' + text;
            } else {
              // do extended autolink path validation
              var prevCapZero;

              do {
                prevCapZero = cap[0];
                cap[0] = this.rules.inline._backpedal.exec(cap[0])[0];
              } while (prevCapZero !== cap[0]);

              text = _escape(cap[0]);

              if (cap[1] === 'www.') {
                href = 'http://' + text;
              } else {
                href = text;
              }
            }

            return {
              type: 'link',
              raw: cap[0],
              text: text,
              href: href,
              tokens: [{
                type: 'text',
                raw: text,
                text: text
              }]
            };
          }
        };

        _proto.inlineText = function inlineText(src, inRawBlock, smartypants) {
          var cap = this.rules.inline.text.exec(src);

          if (cap) {
            var text;

            if (inRawBlock) {
              text = this.options.sanitize ? this.options.sanitizer ? this.options.sanitizer(cap[0]) : _escape(cap[0]) : cap[0];
            } else {
              text = _escape(this.options.smartypants ? smartypants(cap[0]) : cap[0]);
            }

            return {
              type: 'text',
              raw: cap[0],
              text: text
            };
          }
        };

        return Tokenizer;
      }();

      var noopTest$1 = helpers.noopTest,
          edit$1 = helpers.edit,
          merge$1 = helpers.merge;
      /**
       * Block-Level Grammar
       */

      var block = {
        newline: /^(?: *(?:\n|$))+/,
        code: /^( {4}[^\n]+(?:\n(?: *(?:\n|$))*)?)+/,
        fences: /^ {0,3}(`{3,}(?=[^`\n]*\n)|~{3,})([^\n]*)\n(?:|([\s\S]*?)\n)(?: {0,3}\1[~`]* *(?:\n+|$)|$)/,
        hr: /^ {0,3}((?:- *){3,}|(?:_ *){3,}|(?:\* *){3,})(?:\n+|$)/,
        heading: /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/,
        blockquote: /^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/,
        list: /^( {0,3})(bull) [\s\S]+?(?:hr|def|\n{2,}(?! )(?! {0,3}bull )\n*|\s*$)/,
        html: '^ {0,3}(?:' // optional indentation
        + '<(script|pre|style)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)' // (1)
        + '|comment[^\\n]*(\\n+|$)' // (2)
        + '|<\\?[\\s\\S]*?(?:\\?>\\n*|$)' // (3)
        + '|<![A-Z][\\s\\S]*?(?:>\\n*|$)' // (4)
        + '|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)' // (5)
        + '|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:\\n{2,}|$)' // (6)
        + '|<(?!script|pre|style)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:\\n{2,}|$)' // (7) open tag
        + '|</(?!script|pre|style)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:\\n{2,}|$)' // (7) closing tag
        + ')',
        def: /^ {0,3}\[(label)\]: *\n? *<?([^\s>]+)>?(?:(?: +\n? *| *\n *)(title))? *(?:\n+|$)/,
        nptable: noopTest$1,
        table: noopTest$1,
        lheading: /^([^\n]+)\n {0,3}(=+|-+) *(?:\n+|$)/,
        // regex template, placeholders will be replaced according to different paragraph
        // interruption rules of commonmark and the original markdown spec:
        _paragraph: /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html| +\n)[^\n]+)*)/,
        text: /^[^\n]+/
      };
      block._label = /(?!\s*\])(?:\\[\[\]]|[^\[\]])+/;
      block._title = /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/;
      block.def = edit$1(block.def).replace('label', block._label).replace('title', block._title).getRegex();
      block.bullet = /(?:[*+-]|\d{1,9}[.)])/;
      block.item = /^( *)(bull) ?[^\n]*(?:\n(?! *bull ?)[^\n]*)*/;
      block.item = edit$1(block.item, 'gm').replace(/bull/g, block.bullet).getRegex();
      block.listItemStart = edit$1(/^( *)(bull)/).replace('bull', block.bullet).getRegex();
      block.list = edit$1(block.list).replace(/bull/g, block.bullet).replace('hr', '\\n+(?=\\1?(?:(?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$))').replace('def', '\\n+(?=' + block.def.source + ')').getRegex();
      block._tag = 'address|article|aside|base|basefont|blockquote|body|caption' + '|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption' + '|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe' + '|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option' + '|p|param|section|source|summary|table|tbody|td|tfoot|th|thead|title|tr' + '|track|ul';
      block._comment = /<!--(?!-?>)[\s\S]*?(?:-->|$)/;
      block.html = edit$1(block.html, 'i').replace('comment', block._comment).replace('tag', block._tag).replace('attribute', / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex();
      block.paragraph = edit$1(block._paragraph).replace('hr', block.hr).replace('heading', ' {0,3}#{1,6} ').replace('|lheading', '') // setex headings don't interrupt commonmark paragraphs
      .replace('blockquote', ' {0,3}>').replace('fences', ' {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n').replace('list', ' {0,3}(?:[*+-]|1[.)]) ') // only lists starting from 1 can interrupt
      .replace('html', '</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|!--)').replace('tag', block._tag) // pars can be interrupted by type (6) html blocks
      .getRegex();
      block.blockquote = edit$1(block.blockquote).replace('paragraph', block.paragraph).getRegex();
      /**
       * Normal Block Grammar
       */

      block.normal = merge$1({}, block);
      /**
       * GFM Block Grammar
       */

      block.gfm = merge$1({}, block.normal, {
        nptable: '^ *([^|\\n ].*\\|.*)\\n' // Header
        + ' {0,3}([-:]+ *\\|[-| :]*)' // Align
        + '(?:\\n((?:(?!\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)',
        // Cells
        table: '^ *\\|(.+)\\n' // Header
        + ' {0,3}\\|?( *[-:]+[-| :]*)' // Align
        + '(?:\\n *((?:(?!\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)' // Cells

      });
      block.gfm.nptable = edit$1(block.gfm.nptable).replace('hr', block.hr).replace('heading', ' {0,3}#{1,6} ').replace('blockquote', ' {0,3}>').replace('code', ' {4}[^\\n]').replace('fences', ' {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n').replace('list', ' {0,3}(?:[*+-]|1[.)]) ') // only lists starting from 1 can interrupt
      .replace('html', '</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|!--)').replace('tag', block._tag) // tables can be interrupted by type (6) html blocks
      .getRegex();
      block.gfm.table = edit$1(block.gfm.table).replace('hr', block.hr).replace('heading', ' {0,3}#{1,6} ').replace('blockquote', ' {0,3}>').replace('code', ' {4}[^\\n]').replace('fences', ' {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n').replace('list', ' {0,3}(?:[*+-]|1[.)]) ') // only lists starting from 1 can interrupt
      .replace('html', '</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|!--)').replace('tag', block._tag) // tables can be interrupted by type (6) html blocks
      .getRegex();
      /**
       * Pedantic grammar (original John Gruber's loose markdown specification)
       */

      block.pedantic = merge$1({}, block.normal, {
        html: edit$1('^ *(?:comment *(?:\\n|\\s*$)' + '|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)' // closed tag
        + '|<tag(?:"[^"]*"|\'[^\']*\'|\\s[^\'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))').replace('comment', block._comment).replace(/tag/g, '(?!(?:' + 'a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub' + '|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)' + '\\b)\\w+(?!:|[^\\w\\s@]*@)\\b').getRegex(),
        def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
        heading: /^(#{1,6})(.*)(?:\n+|$)/,
        fences: noopTest$1,
        // fences not supported
        paragraph: edit$1(block.normal._paragraph).replace('hr', block.hr).replace('heading', ' *#{1,6} *[^\n]').replace('lheading', block.lheading).replace('blockquote', ' {0,3}>').replace('|fences', '').replace('|list', '').replace('|html', '').getRegex()
      });
      /**
       * Inline-Level Grammar
       */

      var inline = {
        escape: /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,
        autolink: /^<(scheme:[^\s\x00-\x1f<>]*|email)>/,
        url: noopTest$1,
        tag: '^comment' + '|^</[a-zA-Z][\\w:-]*\\s*>' // self-closing tag
        + '|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>' // open tag
        + '|^<\\?[\\s\\S]*?\\?>' // processing instruction, e.g. <?php ?>
        + '|^<![a-zA-Z]+\\s[\\s\\S]*?>' // declaration, e.g. <!DOCTYPE html>
        + '|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>',
        // CDATA section
        link: /^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/,
        reflink: /^!?\[(label)\]\[(?!\s*\])((?:\\[\[\]]?|[^\[\]\\])+)\]/,
        nolink: /^!?\[(?!\s*\])((?:\[[^\[\]]*\]|\\[\[\]]|[^\[\]])*)\](?:\[\])?/,
        reflinkSearch: 'reflink|nolink(?!\\()',
        emStrong: {
          lDelim: /^(?:\*+(?:([punct_])|[^\s*]))|^_+(?:([punct*])|([^\s_]))/,
          //        (1) and (2) can only be a Right Delimiter. (3) and (4) can only be Left.  (5) and (6) can be either Left or Right.
          //        () Skip other delimiter (1) #***                (2) a***#, a***                   (3) #***a, ***a                 (4) ***#              (5) #***#                 (6) a***a
          rDelimAst: /\_\_[^_]*?\*[^_]*?\_\_|[punct_](\*+)(?=[\s]|$)|[^punct*_\s](\*+)(?=[punct_\s]|$)|[punct_\s](\*+)(?=[^punct*_\s])|[\s](\*+)(?=[punct_])|[punct_](\*+)(?=[punct_])|[^punct*_\s](\*+)(?=[^punct*_\s])/,
          rDelimUnd: /\*\*[^*]*?\_[^*]*?\*\*|[punct*](\_+)(?=[\s]|$)|[^punct*_\s](\_+)(?=[punct*\s]|$)|[punct*\s](\_+)(?=[^punct*_\s])|[\s](\_+)(?=[punct*])|[punct*](\_+)(?=[punct*])/ // ^- Not allowed for _

        },
        code: /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,
        br: /^( {2,}|\\)\n(?!\s*$)/,
        del: noopTest$1,
        text: /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/,
        punctuation: /^([\spunctuation])/
      }; // list of punctuation marks from CommonMark spec
      // without * and _ to handle the different emphasis markers * and _

      inline._punctuation = '!"#$%&\'()+\\-.,/:;<=>?@\\[\\]`^{|}~';
      inline.punctuation = edit$1(inline.punctuation).replace(/punctuation/g, inline._punctuation).getRegex(); // sequences em should skip over [title](link), `code`, <html>

      inline.blockSkip = /\[[^\]]*?\]\([^\)]*?\)|`[^`]*?`|<[^>]*?>/g;
      inline.escapedEmSt = /\\\*|\\_/g;
      inline._comment = edit$1(block._comment).replace('(?:-->|$)', '-->').getRegex();
      inline.emStrong.lDelim = edit$1(inline.emStrong.lDelim).replace(/punct/g, inline._punctuation).getRegex();
      inline.emStrong.rDelimAst = edit$1(inline.emStrong.rDelimAst, 'g').replace(/punct/g, inline._punctuation).getRegex();
      inline.emStrong.rDelimUnd = edit$1(inline.emStrong.rDelimUnd, 'g').replace(/punct/g, inline._punctuation).getRegex();
      inline._escapes = /\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/g;
      inline._scheme = /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/;
      inline._email = /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/;
      inline.autolink = edit$1(inline.autolink).replace('scheme', inline._scheme).replace('email', inline._email).getRegex();
      inline._attribute = /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/;
      inline.tag = edit$1(inline.tag).replace('comment', inline._comment).replace('attribute', inline._attribute).getRegex();
      inline._label = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/;
      inline._href = /<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/;
      inline._title = /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/;
      inline.link = edit$1(inline.link).replace('label', inline._label).replace('href', inline._href).replace('title', inline._title).getRegex();
      inline.reflink = edit$1(inline.reflink).replace('label', inline._label).getRegex();
      inline.reflinkSearch = edit$1(inline.reflinkSearch, 'g').replace('reflink', inline.reflink).replace('nolink', inline.nolink).getRegex();
      /**
       * Normal Inline Grammar
       */

      inline.normal = merge$1({}, inline);
      /**
       * Pedantic Inline Grammar
       */

      inline.pedantic = merge$1({}, inline.normal, {
        strong: {
          start: /^__|\*\*/,
          middle: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
          endAst: /\*\*(?!\*)/g,
          endUnd: /__(?!_)/g
        },
        em: {
          start: /^_|\*/,
          middle: /^()\*(?=\S)([\s\S]*?\S)\*(?!\*)|^_(?=\S)([\s\S]*?\S)_(?!_)/,
          endAst: /\*(?!\*)/g,
          endUnd: /_(?!_)/g
        },
        link: edit$1(/^!?\[(label)\]\((.*?)\)/).replace('label', inline._label).getRegex(),
        reflink: edit$1(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace('label', inline._label).getRegex()
      });
      /**
       * GFM Inline Grammar
       */

      inline.gfm = merge$1({}, inline.normal, {
        escape: edit$1(inline.escape).replace('])', '~|])').getRegex(),
        _extended_email: /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/,
        url: /^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/,
        _backpedal: /(?:[^?!.,:;*_~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_~)]+(?!$))+/,
        del: /^(~~?)(?=[^\s~])([\s\S]*?[^\s~])\1(?=[^~]|$)/,
        text: /^([`~]+|[^`~])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@))|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@))/
      });
      inline.gfm.url = edit$1(inline.gfm.url, 'i').replace('email', inline.gfm._extended_email).getRegex();
      /**
       * GFM + Line Breaks Inline Grammar
       */

      inline.breaks = merge$1({}, inline.gfm, {
        br: edit$1(inline.br).replace('{2,}', '*').getRegex(),
        text: edit$1(inline.gfm.text).replace('\\b_', '\\b_| {2,}\\n').replace(/\{2,\}/g, '*').getRegex()
      });
      var rules = {
        block: block,
        inline: inline
      };

      var defaults$2 = defaults.defaults;
      var block$1 = rules.block,
          inline$1 = rules.inline;
      var repeatString$1 = helpers.repeatString;
      /**
       * smartypants text replacement
       */

      function smartypants(text) {
        return text // em-dashes
        .replace(/---/g, "\u2014") // en-dashes
        .replace(/--/g, "\u2013") // opening singles
        .replace(/(^|[-\u2014/(\[{"\s])'/g, "$1\u2018") // closing singles & apostrophes
        .replace(/'/g, "\u2019") // opening doubles
        .replace(/(^|[-\u2014/(\[{\u2018\s])"/g, "$1\u201C") // closing doubles
        .replace(/"/g, "\u201D") // ellipses
        .replace(/\.{3}/g, "\u2026");
      }
      /**
       * mangle email addresses
       */


      function mangle(text) {
        var out = '',
            i,
            ch;
        var l = text.length;

        for (i = 0; i < l; i++) {
          ch = text.charCodeAt(i);

          if (Math.random() > 0.5) {
            ch = 'x' + ch.toString(16);
          }

          out += '&#' + ch + ';';
        }

        return out;
      }
      /**
       * Block Lexer
       */


      var Lexer_1 = /*#__PURE__*/function () {
        function Lexer(options) {
          this.tokens = [];
          this.tokens.links = Object.create(null);
          this.options = options || defaults$2;
          this.options.tokenizer = this.options.tokenizer || new Tokenizer_1();
          this.tokenizer = this.options.tokenizer;
          this.tokenizer.options = this.options;
          var rules = {
            block: block$1.normal,
            inline: inline$1.normal
          };

          if (this.options.pedantic) {
            rules.block = block$1.pedantic;
            rules.inline = inline$1.pedantic;
          } else if (this.options.gfm) {
            rules.block = block$1.gfm;

            if (this.options.breaks) {
              rules.inline = inline$1.breaks;
            } else {
              rules.inline = inline$1.gfm;
            }
          }

          this.tokenizer.rules = rules;
        }
        /**
         * Expose Rules
         */


        /**
         * Static Lex Method
         */
        Lexer.lex = function lex(src, options) {
          var lexer = new Lexer(options);
          return lexer.lex(src);
        }
        /**
         * Static Lex Inline Method
         */
        ;

        Lexer.lexInline = function lexInline(src, options) {
          var lexer = new Lexer(options);
          return lexer.inlineTokens(src);
        }
        /**
         * Preprocessing
         */
        ;

        var _proto = Lexer.prototype;

        _proto.lex = function lex(src) {
          src = src.replace(/\r\n|\r/g, '\n').replace(/\t/g, '    ');
          this.blockTokens(src, this.tokens, true);
          this.inline(this.tokens);
          return this.tokens;
        }
        /**
         * Lexing
         */
        ;

        _proto.blockTokens = function blockTokens(src, tokens, top) {
          if (tokens === void 0) {
            tokens = [];
          }

          if (top === void 0) {
            top = true;
          }

          if (this.options.pedantic) {
            src = src.replace(/^ +$/gm, '');
          }

          var token, i, l, lastToken;

          while (src) {
            // newline
            if (token = this.tokenizer.space(src)) {
              src = src.substring(token.raw.length);

              if (token.type) {
                tokens.push(token);
              }

              continue;
            } // code


            if (token = this.tokenizer.code(src)) {
              src = src.substring(token.raw.length);
              lastToken = tokens[tokens.length - 1]; // An indented code block cannot interrupt a paragraph.

              if (lastToken && lastToken.type === 'paragraph') {
                lastToken.raw += '\n' + token.raw;
                lastToken.text += '\n' + token.text;
              } else {
                tokens.push(token);
              }

              continue;
            } // fences


            if (token = this.tokenizer.fences(src)) {
              src = src.substring(token.raw.length);
              tokens.push(token);
              continue;
            } // heading


            if (token = this.tokenizer.heading(src)) {
              src = src.substring(token.raw.length);
              tokens.push(token);
              continue;
            } // table no leading pipe (gfm)


            if (token = this.tokenizer.nptable(src)) {
              src = src.substring(token.raw.length);
              tokens.push(token);
              continue;
            } // hr


            if (token = this.tokenizer.hr(src)) {
              src = src.substring(token.raw.length);
              tokens.push(token);
              continue;
            } // blockquote


            if (token = this.tokenizer.blockquote(src)) {
              src = src.substring(token.raw.length);
              token.tokens = this.blockTokens(token.text, [], top);
              tokens.push(token);
              continue;
            } // list


            if (token = this.tokenizer.list(src)) {
              src = src.substring(token.raw.length);
              l = token.items.length;

              for (i = 0; i < l; i++) {
                token.items[i].tokens = this.blockTokens(token.items[i].text, [], false);
              }

              tokens.push(token);
              continue;
            } // html


            if (token = this.tokenizer.html(src)) {
              src = src.substring(token.raw.length);
              tokens.push(token);
              continue;
            } // def


            if (top && (token = this.tokenizer.def(src))) {
              src = src.substring(token.raw.length);

              if (!this.tokens.links[token.tag]) {
                this.tokens.links[token.tag] = {
                  href: token.href,
                  title: token.title
                };
              }

              continue;
            } // table (gfm)


            if (token = this.tokenizer.table(src)) {
              src = src.substring(token.raw.length);
              tokens.push(token);
              continue;
            } // lheading


            if (token = this.tokenizer.lheading(src)) {
              src = src.substring(token.raw.length);
              tokens.push(token);
              continue;
            } // top-level paragraph


            if (top && (token = this.tokenizer.paragraph(src))) {
              src = src.substring(token.raw.length);
              tokens.push(token);
              continue;
            } // text


            if (token = this.tokenizer.text(src)) {
              src = src.substring(token.raw.length);
              lastToken = tokens[tokens.length - 1];

              if (lastToken && lastToken.type === 'text') {
                lastToken.raw += '\n' + token.raw;
                lastToken.text += '\n' + token.text;
              } else {
                tokens.push(token);
              }

              continue;
            }

            if (src) {
              var errMsg = 'Infinite loop on byte: ' + src.charCodeAt(0);

              if (this.options.silent) {
                console.error(errMsg);
                break;
              } else {
                throw new Error(errMsg);
              }
            }
          }

          return tokens;
        };

        _proto.inline = function inline(tokens) {
          var i, j, k, l2, row, token;
          var l = tokens.length;

          for (i = 0; i < l; i++) {
            token = tokens[i];

            switch (token.type) {
              case 'paragraph':
              case 'text':
              case 'heading':
                {
                  token.tokens = [];
                  this.inlineTokens(token.text, token.tokens);
                  break;
                }

              case 'table':
                {
                  token.tokens = {
                    header: [],
                    cells: []
                  }; // header

                  l2 = token.header.length;

                  for (j = 0; j < l2; j++) {
                    token.tokens.header[j] = [];
                    this.inlineTokens(token.header[j], token.tokens.header[j]);
                  } // cells


                  l2 = token.cells.length;

                  for (j = 0; j < l2; j++) {
                    row = token.cells[j];
                    token.tokens.cells[j] = [];

                    for (k = 0; k < row.length; k++) {
                      token.tokens.cells[j][k] = [];
                      this.inlineTokens(row[k], token.tokens.cells[j][k]);
                    }
                  }

                  break;
                }

              case 'blockquote':
                {
                  this.inline(token.tokens);
                  break;
                }

              case 'list':
                {
                  l2 = token.items.length;

                  for (j = 0; j < l2; j++) {
                    this.inline(token.items[j].tokens);
                  }

                  break;
                }
            }
          }

          return tokens;
        }
        /**
         * Lexing/Compiling
         */
        ;

        _proto.inlineTokens = function inlineTokens(src, tokens, inLink, inRawBlock) {
          if (tokens === void 0) {
            tokens = [];
          }

          if (inLink === void 0) {
            inLink = false;
          }

          if (inRawBlock === void 0) {
            inRawBlock = false;
          }

          var token, lastToken; // String with links masked to avoid interference with em and strong

          var maskedSrc = src;
          var match;
          var keepPrevChar, prevChar; // Mask out reflinks

          if (this.tokens.links) {
            var links = Object.keys(this.tokens.links);

            if (links.length > 0) {
              while ((match = this.tokenizer.rules.inline.reflinkSearch.exec(maskedSrc)) != null) {
                if (links.includes(match[0].slice(match[0].lastIndexOf('[') + 1, -1))) {
                  maskedSrc = maskedSrc.slice(0, match.index) + '[' + repeatString$1('a', match[0].length - 2) + ']' + maskedSrc.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex);
                }
              }
            }
          } // Mask out other blocks


          while ((match = this.tokenizer.rules.inline.blockSkip.exec(maskedSrc)) != null) {
            maskedSrc = maskedSrc.slice(0, match.index) + '[' + repeatString$1('a', match[0].length - 2) + ']' + maskedSrc.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
          } // Mask out escaped em & strong delimiters


          while ((match = this.tokenizer.rules.inline.escapedEmSt.exec(maskedSrc)) != null) {
            maskedSrc = maskedSrc.slice(0, match.index) + '++' + maskedSrc.slice(this.tokenizer.rules.inline.escapedEmSt.lastIndex);
          }

          while (src) {
            if (!keepPrevChar) {
              prevChar = '';
            }

            keepPrevChar = false; // escape

            if (token = this.tokenizer.escape(src)) {
              src = src.substring(token.raw.length);
              tokens.push(token);
              continue;
            } // tag


            if (token = this.tokenizer.tag(src, inLink, inRawBlock)) {
              src = src.substring(token.raw.length);
              inLink = token.inLink;
              inRawBlock = token.inRawBlock;
              var _lastToken = tokens[tokens.length - 1];

              if (_lastToken && token.type === 'text' && _lastToken.type === 'text') {
                _lastToken.raw += token.raw;
                _lastToken.text += token.text;
              } else {
                tokens.push(token);
              }

              continue;
            } // link


            if (token = this.tokenizer.link(src)) {
              src = src.substring(token.raw.length);

              if (token.type === 'link') {
                token.tokens = this.inlineTokens(token.text, [], true, inRawBlock);
              }

              tokens.push(token);
              continue;
            } // reflink, nolink


            if (token = this.tokenizer.reflink(src, this.tokens.links)) {
              src = src.substring(token.raw.length);
              var _lastToken2 = tokens[tokens.length - 1];

              if (token.type === 'link') {
                token.tokens = this.inlineTokens(token.text, [], true, inRawBlock);
                tokens.push(token);
              } else if (_lastToken2 && token.type === 'text' && _lastToken2.type === 'text') {
                _lastToken2.raw += token.raw;
                _lastToken2.text += token.text;
              } else {
                tokens.push(token);
              }

              continue;
            } // em & strong


            if (token = this.tokenizer.emStrong(src, maskedSrc, prevChar)) {
              src = src.substring(token.raw.length);
              token.tokens = this.inlineTokens(token.text, [], inLink, inRawBlock);
              tokens.push(token);
              continue;
            } // code


            if (token = this.tokenizer.codespan(src)) {
              src = src.substring(token.raw.length);
              tokens.push(token);
              continue;
            } // br


            if (token = this.tokenizer.br(src)) {
              src = src.substring(token.raw.length);
              tokens.push(token);
              continue;
            } // del (gfm)


            if (token = this.tokenizer.del(src)) {
              src = src.substring(token.raw.length);
              token.tokens = this.inlineTokens(token.text, [], inLink, inRawBlock);
              tokens.push(token);
              continue;
            } // autolink


            if (token = this.tokenizer.autolink(src, mangle)) {
              src = src.substring(token.raw.length);
              tokens.push(token);
              continue;
            } // url (gfm)


            if (!inLink && (token = this.tokenizer.url(src, mangle))) {
              src = src.substring(token.raw.length);
              tokens.push(token);
              continue;
            } // text


            if (token = this.tokenizer.inlineText(src, inRawBlock, smartypants)) {
              src = src.substring(token.raw.length);

              if (token.raw.slice(-1) !== '_') {
                // Track prevChar before string of ____ started
                prevChar = token.raw.slice(-1);
              }

              keepPrevChar = true;
              lastToken = tokens[tokens.length - 1];

              if (lastToken && lastToken.type === 'text') {
                lastToken.raw += token.raw;
                lastToken.text += token.text;
              } else {
                tokens.push(token);
              }

              continue;
            }

            if (src) {
              var errMsg = 'Infinite loop on byte: ' + src.charCodeAt(0);

              if (this.options.silent) {
                console.error(errMsg);
                break;
              } else {
                throw new Error(errMsg);
              }
            }
          }

          return tokens;
        };

        _createClass(Lexer, null, [{
          key: "rules",
          get: function get() {
            return {
              block: block$1,
              inline: inline$1
            };
          }
        }]);

        return Lexer;
      }();

      var defaults$3 = defaults.defaults;
      var cleanUrl$1 = helpers.cleanUrl,
          escape$1 = helpers.escape;
      /**
       * Renderer
       */

      var Renderer_1 = /*#__PURE__*/function () {
        function Renderer(options) {
          this.options = options || defaults$3;
        }

        var _proto = Renderer.prototype;

        _proto.code = function code(_code, infostring, escaped) {
          var lang = (infostring || '').match(/\S*/)[0];

          if (this.options.highlight) {
            var out = this.options.highlight(_code, lang);

            if (out != null && out !== _code) {
              escaped = true;
              _code = out;
            }
          }

          _code = _code.replace(/\n$/, '') + '\n';

          if (!lang) {
            return '<pre><code>' + (escaped ? _code : escape$1(_code, true)) + '</code></pre>\n';
          }

          return '<pre><code class="' + this.options.langPrefix + escape$1(lang, true) + '">' + (escaped ? _code : escape$1(_code, true)) + '</code></pre>\n';
        };

        _proto.blockquote = function blockquote(quote) {
          return '<blockquote>\n' + quote + '</blockquote>\n';
        };

        _proto.html = function html(_html) {
          return _html;
        };

        _proto.heading = function heading(text, level, raw, slugger) {
          if (this.options.headerIds) {
            return '<h' + level + ' id="' + this.options.headerPrefix + slugger.slug(raw) + '">' + text + '</h' + level + '>\n';
          } // ignore IDs


          return '<h' + level + '>' + text + '</h' + level + '>\n';
        };

        _proto.hr = function hr() {
          return this.options.xhtml ? '<hr/>\n' : '<hr>\n';
        };

        _proto.list = function list(body, ordered, start) {
          var type = ordered ? 'ol' : 'ul',
              startatt = ordered && start !== 1 ? ' start="' + start + '"' : '';
          return '<' + type + startatt + '>\n' + body + '</' + type + '>\n';
        };

        _proto.listitem = function listitem(text) {
          return '<li>' + text + '</li>\n';
        };

        _proto.checkbox = function checkbox(checked) {
          return '<input ' + (checked ? 'checked="" ' : '') + 'disabled="" type="checkbox"' + (this.options.xhtml ? ' /' : '') + '> ';
        };

        _proto.paragraph = function paragraph(text) {
          return '<p>' + text + '</p>\n';
        };

        _proto.table = function table(header, body) {
          if (body) body = '<tbody>' + body + '</tbody>';
          return '<table>\n' + '<thead>\n' + header + '</thead>\n' + body + '</table>\n';
        };

        _proto.tablerow = function tablerow(content) {
          return '<tr>\n' + content + '</tr>\n';
        };

        _proto.tablecell = function tablecell(content, flags) {
          var type = flags.header ? 'th' : 'td';
          var tag = flags.align ? '<' + type + ' align="' + flags.align + '">' : '<' + type + '>';
          return tag + content + '</' + type + '>\n';
        } // span level renderer
        ;

        _proto.strong = function strong(text) {
          return '<strong>' + text + '</strong>';
        };

        _proto.em = function em(text) {
          return '<em>' + text + '</em>';
        };

        _proto.codespan = function codespan(text) {
          return '<code>' + text + '</code>';
        };

        _proto.br = function br() {
          return this.options.xhtml ? '<br/>' : '<br>';
        };

        _proto.del = function del(text) {
          return '<del>' + text + '</del>';
        };

        _proto.link = function link(href, title, text) {
          href = cleanUrl$1(this.options.sanitize, this.options.baseUrl, href);

          if (href === null) {
            return text;
          }

          var out = '<a href="' + escape$1(href) + '"';

          if (title) {
            out += ' title="' + title + '"';
          }

          out += '>' + text + '</a>';
          return out;
        };

        _proto.image = function image(href, title, text) {
          href = cleanUrl$1(this.options.sanitize, this.options.baseUrl, href);

          if (href === null) {
            return text;
          }

          var out = '<img src="' + href + '" alt="' + text + '"';

          if (title) {
            out += ' title="' + title + '"';
          }

          out += this.options.xhtml ? '/>' : '>';
          return out;
        };

        _proto.text = function text(_text) {
          return _text;
        };

        return Renderer;
      }();

      /**
       * TextRenderer
       * returns only the textual part of the token
       */
      var TextRenderer_1 = /*#__PURE__*/function () {
        function TextRenderer() {}

        var _proto = TextRenderer.prototype;

        // no need for block level renderers
        _proto.strong = function strong(text) {
          return text;
        };

        _proto.em = function em(text) {
          return text;
        };

        _proto.codespan = function codespan(text) {
          return text;
        };

        _proto.del = function del(text) {
          return text;
        };

        _proto.html = function html(text) {
          return text;
        };

        _proto.text = function text(_text) {
          return _text;
        };

        _proto.link = function link(href, title, text) {
          return '' + text;
        };

        _proto.image = function image(href, title, text) {
          return '' + text;
        };

        _proto.br = function br() {
          return '';
        };

        return TextRenderer;
      }();

      /**
       * Slugger generates header id
       */
      var Slugger_1 = /*#__PURE__*/function () {
        function Slugger() {
          this.seen = {};
        }

        var _proto = Slugger.prototype;

        _proto.serialize = function serialize(value) {
          return value.toLowerCase().trim() // remove html tags
          .replace(/<[!\/a-z].*?>/ig, '') // remove unwanted chars
          .replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,./:;<=>?@[\]^`{|}~]/g, '').replace(/\s/g, '-');
        }
        /**
         * Finds the next safe (unique) slug to use
         */
        ;

        _proto.getNextSafeSlug = function getNextSafeSlug(originalSlug, isDryRun) {
          var slug = originalSlug;
          var occurenceAccumulator = 0;

          if (this.seen.hasOwnProperty(slug)) {
            occurenceAccumulator = this.seen[originalSlug];

            do {
              occurenceAccumulator++;
              slug = originalSlug + '-' + occurenceAccumulator;
            } while (this.seen.hasOwnProperty(slug));
          }

          if (!isDryRun) {
            this.seen[originalSlug] = occurenceAccumulator;
            this.seen[slug] = 0;
          }

          return slug;
        }
        /**
         * Convert string to unique id
         * @param {object} options
         * @param {boolean} options.dryrun Generates the next unique slug without updating the internal accumulator.
         */
        ;

        _proto.slug = function slug(value, options) {
          if (options === void 0) {
            options = {};
          }

          var slug = this.serialize(value);
          return this.getNextSafeSlug(slug, options.dryrun);
        };

        return Slugger;
      }();

      var defaults$4 = defaults.defaults;
      var unescape$1 = helpers.unescape;
      /**
       * Parsing & Compiling
       */

      var Parser_1 = /*#__PURE__*/function () {
        function Parser(options) {
          this.options = options || defaults$4;
          this.options.renderer = this.options.renderer || new Renderer_1();
          this.renderer = this.options.renderer;
          this.renderer.options = this.options;
          this.textRenderer = new TextRenderer_1();
          this.slugger = new Slugger_1();
        }
        /**
         * Static Parse Method
         */


        Parser.parse = function parse(tokens, options) {
          var parser = new Parser(options);
          return parser.parse(tokens);
        }
        /**
         * Static Parse Inline Method
         */
        ;

        Parser.parseInline = function parseInline(tokens, options) {
          var parser = new Parser(options);
          return parser.parseInline(tokens);
        }
        /**
         * Parse Loop
         */
        ;

        var _proto = Parser.prototype;

        _proto.parse = function parse(tokens, top) {
          if (top === void 0) {
            top = true;
          }

          var out = '',
              i,
              j,
              k,
              l2,
              l3,
              row,
              cell,
              header,
              body,
              token,
              ordered,
              start,
              loose,
              itemBody,
              item,
              checked,
              task,
              checkbox;
          var l = tokens.length;

          for (i = 0; i < l; i++) {
            token = tokens[i];

            switch (token.type) {
              case 'space':
                {
                  continue;
                }

              case 'hr':
                {
                  out += this.renderer.hr();
                  continue;
                }

              case 'heading':
                {
                  out += this.renderer.heading(this.parseInline(token.tokens), token.depth, unescape$1(this.parseInline(token.tokens, this.textRenderer)), this.slugger);
                  continue;
                }

              case 'code':
                {
                  out += this.renderer.code(token.text, token.lang, token.escaped);
                  continue;
                }

              case 'table':
                {
                  header = ''; // header

                  cell = '';
                  l2 = token.header.length;

                  for (j = 0; j < l2; j++) {
                    cell += this.renderer.tablecell(this.parseInline(token.tokens.header[j]), {
                      header: true,
                      align: token.align[j]
                    });
                  }

                  header += this.renderer.tablerow(cell);
                  body = '';
                  l2 = token.cells.length;

                  for (j = 0; j < l2; j++) {
                    row = token.tokens.cells[j];
                    cell = '';
                    l3 = row.length;

                    for (k = 0; k < l3; k++) {
                      cell += this.renderer.tablecell(this.parseInline(row[k]), {
                        header: false,
                        align: token.align[k]
                      });
                    }

                    body += this.renderer.tablerow(cell);
                  }

                  out += this.renderer.table(header, body);
                  continue;
                }

              case 'blockquote':
                {
                  body = this.parse(token.tokens);
                  out += this.renderer.blockquote(body);
                  continue;
                }

              case 'list':
                {
                  ordered = token.ordered;
                  start = token.start;
                  loose = token.loose;
                  l2 = token.items.length;
                  body = '';

                  for (j = 0; j < l2; j++) {
                    item = token.items[j];
                    checked = item.checked;
                    task = item.task;
                    itemBody = '';

                    if (item.task) {
                      checkbox = this.renderer.checkbox(checked);

                      if (loose) {
                        if (item.tokens.length > 0 && item.tokens[0].type === 'text') {
                          item.tokens[0].text = checkbox + ' ' + item.tokens[0].text;

                          if (item.tokens[0].tokens && item.tokens[0].tokens.length > 0 && item.tokens[0].tokens[0].type === 'text') {
                            item.tokens[0].tokens[0].text = checkbox + ' ' + item.tokens[0].tokens[0].text;
                          }
                        } else {
                          item.tokens.unshift({
                            type: 'text',
                            text: checkbox
                          });
                        }
                      } else {
                        itemBody += checkbox;
                      }
                    }

                    itemBody += this.parse(item.tokens, loose);
                    body += this.renderer.listitem(itemBody, task, checked);
                  }

                  out += this.renderer.list(body, ordered, start);
                  continue;
                }

              case 'html':
                {
                  // TODO parse inline content if parameter markdown=1
                  out += this.renderer.html(token.text);
                  continue;
                }

              case 'paragraph':
                {
                  out += this.renderer.paragraph(this.parseInline(token.tokens));
                  continue;
                }

              case 'text':
                {
                  body = token.tokens ? this.parseInline(token.tokens) : token.text;

                  while (i + 1 < l && tokens[i + 1].type === 'text') {
                    token = tokens[++i];
                    body += '\n' + (token.tokens ? this.parseInline(token.tokens) : token.text);
                  }

                  out += top ? this.renderer.paragraph(body) : body;
                  continue;
                }

              default:
                {
                  var errMsg = 'Token with "' + token.type + '" type was not found.';

                  if (this.options.silent) {
                    console.error(errMsg);
                    return;
                  } else {
                    throw new Error(errMsg);
                  }
                }
            }
          }

          return out;
        }
        /**
         * Parse Inline Tokens
         */
        ;

        _proto.parseInline = function parseInline(tokens, renderer) {
          renderer = renderer || this.renderer;
          var out = '',
              i,
              token;
          var l = tokens.length;

          for (i = 0; i < l; i++) {
            token = tokens[i];

            switch (token.type) {
              case 'escape':
                {
                  out += renderer.text(token.text);
                  break;
                }

              case 'html':
                {
                  out += renderer.html(token.text);
                  break;
                }

              case 'link':
                {
                  out += renderer.link(token.href, token.title, this.parseInline(token.tokens, renderer));
                  break;
                }

              case 'image':
                {
                  out += renderer.image(token.href, token.title, token.text);
                  break;
                }

              case 'strong':
                {
                  out += renderer.strong(this.parseInline(token.tokens, renderer));
                  break;
                }

              case 'em':
                {
                  out += renderer.em(this.parseInline(token.tokens, renderer));
                  break;
                }

              case 'codespan':
                {
                  out += renderer.codespan(token.text);
                  break;
                }

              case 'br':
                {
                  out += renderer.br();
                  break;
                }

              case 'del':
                {
                  out += renderer.del(this.parseInline(token.tokens, renderer));
                  break;
                }

              case 'text':
                {
                  out += renderer.text(token.text);
                  break;
                }

              default:
                {
                  var errMsg = 'Token with "' + token.type + '" type was not found.';

                  if (this.options.silent) {
                    console.error(errMsg);
                    return;
                  } else {
                    throw new Error(errMsg);
                  }
                }
            }
          }

          return out;
        };

        return Parser;
      }();

      var merge$2 = helpers.merge,
          checkSanitizeDeprecation$1 = helpers.checkSanitizeDeprecation,
          escape$2 = helpers.escape;
      var getDefaults = defaults.getDefaults,
          changeDefaults = defaults.changeDefaults,
          defaults$5 = defaults.defaults;
      /**
       * Marked
       */

      function marked(src, opt, callback) {
        // throw error in case of non string input
        if (typeof src === 'undefined' || src === null) {
          throw new Error('marked(): input parameter is undefined or null');
        }

        if (typeof src !== 'string') {
          throw new Error('marked(): input parameter is of type ' + Object.prototype.toString.call(src) + ', string expected');
        }

        if (typeof opt === 'function') {
          callback = opt;
          opt = null;
        }

        opt = merge$2({}, marked.defaults, opt || {});
        checkSanitizeDeprecation$1(opt);

        if (callback) {
          var highlight = opt.highlight;
          var tokens;

          try {
            tokens = Lexer_1.lex(src, opt);
          } catch (e) {
            return callback(e);
          }

          var done = function done(err) {
            var out;

            if (!err) {
              try {
                out = Parser_1.parse(tokens, opt);
              } catch (e) {
                err = e;
              }
            }

            opt.highlight = highlight;
            return err ? callback(err) : callback(null, out);
          };

          if (!highlight || highlight.length < 3) {
            return done();
          }

          delete opt.highlight;
          if (!tokens.length) return done();
          var pending = 0;
          marked.walkTokens(tokens, function (token) {
            if (token.type === 'code') {
              pending++;
              setTimeout(function () {
                highlight(token.text, token.lang, function (err, code) {
                  if (err) {
                    return done(err);
                  }

                  if (code != null && code !== token.text) {
                    token.text = code;
                    token.escaped = true;
                  }

                  pending--;

                  if (pending === 0) {
                    done();
                  }
                });
              }, 0);
            }
          });

          if (pending === 0) {
            done();
          }

          return;
        }

        try {
          var _tokens = Lexer_1.lex(src, opt);

          if (opt.walkTokens) {
            marked.walkTokens(_tokens, opt.walkTokens);
          }

          return Parser_1.parse(_tokens, opt);
        } catch (e) {
          e.message += '\nPlease report this to https://github.com/markedjs/marked.';

          if (opt.silent) {
            return '<p>An error occurred:</p><pre>' + escape$2(e.message + '', true) + '</pre>';
          }

          throw e;
        }
      }
      /**
       * Options
       */


      marked.options = marked.setOptions = function (opt) {
        merge$2(marked.defaults, opt);
        changeDefaults(marked.defaults);
        return marked;
      };

      marked.getDefaults = getDefaults;
      marked.defaults = defaults$5;
      /**
       * Use Extension
       */

      marked.use = function (extension) {
        var opts = merge$2({}, extension);

        if (extension.renderer) {
          (function () {
            var renderer = marked.defaults.renderer || new Renderer_1();

            var _loop = function _loop(prop) {
              var prevRenderer = renderer[prop];

              renderer[prop] = function () {
                for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
                  args[_key] = arguments[_key];
                }

                var ret = extension.renderer[prop].apply(renderer, args);

                if (ret === false) {
                  ret = prevRenderer.apply(renderer, args);
                }

                return ret;
              };
            };

            for (var prop in extension.renderer) {
              _loop(prop);
            }

            opts.renderer = renderer;
          })();
        }

        if (extension.tokenizer) {
          (function () {
            var tokenizer = marked.defaults.tokenizer || new Tokenizer_1();

            var _loop2 = function _loop2(prop) {
              var prevTokenizer = tokenizer[prop];

              tokenizer[prop] = function () {
                for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                  args[_key2] = arguments[_key2];
                }

                var ret = extension.tokenizer[prop].apply(tokenizer, args);

                if (ret === false) {
                  ret = prevTokenizer.apply(tokenizer, args);
                }

                return ret;
              };
            };

            for (var prop in extension.tokenizer) {
              _loop2(prop);
            }

            opts.tokenizer = tokenizer;
          })();
        }

        if (extension.walkTokens) {
          var walkTokens = marked.defaults.walkTokens;

          opts.walkTokens = function (token) {
            extension.walkTokens(token);

            if (walkTokens) {
              walkTokens(token);
            }
          };
        }

        marked.setOptions(opts);
      };
      /**
       * Run callback for every token
       */


      marked.walkTokens = function (tokens, callback) {
        for (var _iterator = _createForOfIteratorHelperLoose(tokens), _step; !(_step = _iterator()).done;) {
          var token = _step.value;
          callback(token);

          switch (token.type) {
            case 'table':
              {
                for (var _iterator2 = _createForOfIteratorHelperLoose(token.tokens.header), _step2; !(_step2 = _iterator2()).done;) {
                  var cell = _step2.value;
                  marked.walkTokens(cell, callback);
                }

                for (var _iterator3 = _createForOfIteratorHelperLoose(token.tokens.cells), _step3; !(_step3 = _iterator3()).done;) {
                  var row = _step3.value;

                  for (var _iterator4 = _createForOfIteratorHelperLoose(row), _step4; !(_step4 = _iterator4()).done;) {
                    var _cell = _step4.value;
                    marked.walkTokens(_cell, callback);
                  }
                }

                break;
              }

            case 'list':
              {
                marked.walkTokens(token.items, callback);
                break;
              }

            default:
              {
                if (token.tokens) {
                  marked.walkTokens(token.tokens, callback);
                }
              }
          }
        }
      };
      /**
       * Parse Inline
       */


      marked.parseInline = function (src, opt) {
        // throw error in case of non string input
        if (typeof src === 'undefined' || src === null) {
          throw new Error('marked.parseInline(): input parameter is undefined or null');
        }

        if (typeof src !== 'string') {
          throw new Error('marked.parseInline(): input parameter is of type ' + Object.prototype.toString.call(src) + ', string expected');
        }

        opt = merge$2({}, marked.defaults, opt || {});
        checkSanitizeDeprecation$1(opt);

        try {
          var tokens = Lexer_1.lexInline(src, opt);

          if (opt.walkTokens) {
            marked.walkTokens(tokens, opt.walkTokens);
          }

          return Parser_1.parseInline(tokens, opt);
        } catch (e) {
          e.message += '\nPlease report this to https://github.com/markedjs/marked.';

          if (opt.silent) {
            return '<p>An error occurred:</p><pre>' + escape$2(e.message + '', true) + '</pre>';
          }

          throw e;
        }
      };
      /**
       * Expose
       */


      marked.Parser = Parser_1;
      marked.parser = Parser_1.parse;
      marked.Renderer = Renderer_1;
      marked.TextRenderer = TextRenderer_1;
      marked.Lexer = Lexer_1;
      marked.lexer = Lexer_1.lex;
      marked.Tokenizer = Tokenizer_1;
      marked.Slugger = Slugger_1;
      marked.parse = marked;
      var marked_1 = marked;

      return marked_1;

    })));
    });

    /* src/routes/IssueView.svelte generated by Svelte v3.29.7 */

    const { console: console_1$6 } = globals;
    const file$p = "src/routes/IssueView.svelte";

    // (27:0) {#if issue}
    function create_if_block$8(ctx) {
    	let centeredflex;
    	let current;

    	centeredflex = new CenteredFlex({
    			props: {
    				$$slots: { default: [create_default_slot$8] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(centeredflex.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(centeredflex, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const centeredflex_changes = {};

    			if (dirty & /*$$scope, issue, projectId, params*/ 39) {
    				centeredflex_changes.$$scope = { dirty, ctx };
    			}

    			centeredflex.$set(centeredflex_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(centeredflex.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(centeredflex.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(centeredflex, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$8.name,
    		type: "if",
    		source: "(27:0) {#if issue}",
    		ctx
    	});

    	return block;
    }

    // (38:12) {#if issue.closed}
    function create_if_block_1$4(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "closed";
    			attr_dev(div, "class", "float-right px-1 border rounded bg-red-700 text-white text-xs");
    			add_location(div, file$p, 38, 16, 1412);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$4.name,
    		type: "if",
    		source: "(38:12) {#if issue.closed}",
    		ctx
    	});

    	return block;
    }

    // (28:4) <CenteredFlex>
    function create_default_slot$8(ctx) {
    	let div0;
    	let t0;
    	let t1_value = /*issue*/ ctx[0].id + "";
    	let t1;
    	let t2;
    	let div3;
    	let div1;
    	let t3_value = /*issue*/ ctx[0].title + "";
    	let t3;
    	let t4;
    	let div2;
    	let linkbutton;
    	let t5;
    	let div5;
    	let div4;
    	let t6;
    	let t7_value = /*issue*/ ctx[0].author.firstName + "";
    	let t7;
    	let t8;
    	let t9_value = /*issue*/ ctx[0].author.lastName + "";
    	let t9;
    	let t10;
    	let t11;
    	let div6;
    	let raw_value = marked(/*issue*/ ctx[0].description) + "";
    	let t12;
    	let div7;
    	let colorbutton;
    	let current;

    	linkbutton = new LinkButton({
    			props: {
    				small: "true",
    				name: "Edit",
    				href: "#/projects/" + /*projectId*/ ctx[2] + "/issues/" + /*params*/ ctx[1].issueId + "/edit"
    			},
    			$$inline: true
    		});

    	let if_block = /*issue*/ ctx[0].closed && create_if_block_1$4(ctx);

    	colorbutton = new ColorButton({
    			props: {
    				name: /*issue*/ ctx[0].closed ? "Reopen issue" : "Close issue",
    				bgColor: "border-red-700",
    				textColor: "text-red-700",
    				pressedBackground: "bg-red-200"
    			},
    			$$inline: true
    		});

    	colorbutton.$on("click", /*switchCloseState*/ ctx[3]);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = text("issue #");
    			t1 = text(t1_value);
    			t2 = space();
    			div3 = element("div");
    			div1 = element("div");
    			t3 = text(t3_value);
    			t4 = space();
    			div2 = element("div");
    			create_component(linkbutton.$$.fragment);
    			t5 = space();
    			div5 = element("div");
    			div4 = element("div");
    			t6 = text("author: ");
    			t7 = text(t7_value);
    			t8 = space();
    			t9 = text(t9_value);
    			t10 = space();
    			if (if_block) if_block.c();
    			t11 = space();
    			div6 = element("div");
    			t12 = space();
    			div7 = element("div");
    			create_component(colorbutton.$$.fragment);
    			attr_dev(div0, "class", "font-bold");
    			add_location(div0, file$p, 28, 8, 825);
    			attr_dev(div1, "class", "text-lg font-bold flex-grow");
    			add_location(div1, file$p, 30, 12, 951);
    			attr_dev(div2, "class", "pt-1 flex");
    			add_location(div2, file$p, 31, 12, 1024);
    			attr_dev(div3, "id", "title-container");
    			attr_dev(div3, "class", "flex w-full items-start");
    			add_location(div3, file$p, 29, 8, 880);
    			attr_dev(div4, "class", "text-sm w-full");
    			add_location(div4, file$p, 36, 12, 1274);
    			attr_dev(div5, "class", "flex w-full justify-start items-center mt-1");
    			add_location(div5, file$p, 35, 8, 1204);
    			attr_dev(div6, "id", "desc-container");
    			attr_dev(div6, "class", "w-full p-3 text-sm text-justify whitespace-pre-wrap svelte-1bjxg04");
    			add_location(div6, file$p, 41, 8, 1541);
    			attr_dev(div7, "id", "issue-action");
    			add_location(div7, file$p, 43, 8, 1687);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, t0);
    			append_dev(div0, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div1);
    			append_dev(div1, t3);
    			append_dev(div3, t4);
    			append_dev(div3, div2);
    			mount_component(linkbutton, div2, null);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div4);
    			append_dev(div4, t6);
    			append_dev(div4, t7);
    			append_dev(div4, t8);
    			append_dev(div4, t9);
    			append_dev(div5, t10);
    			if (if_block) if_block.m(div5, null);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, div6, anchor);
    			div6.innerHTML = raw_value;
    			insert_dev(target, t12, anchor);
    			insert_dev(target, div7, anchor);
    			mount_component(colorbutton, div7, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*issue*/ 1) && t1_value !== (t1_value = /*issue*/ ctx[0].id + "")) set_data_dev(t1, t1_value);
    			if ((!current || dirty & /*issue*/ 1) && t3_value !== (t3_value = /*issue*/ ctx[0].title + "")) set_data_dev(t3, t3_value);
    			const linkbutton_changes = {};
    			if (dirty & /*projectId, params*/ 6) linkbutton_changes.href = "#/projects/" + /*projectId*/ ctx[2] + "/issues/" + /*params*/ ctx[1].issueId + "/edit";
    			linkbutton.$set(linkbutton_changes);
    			if ((!current || dirty & /*issue*/ 1) && t7_value !== (t7_value = /*issue*/ ctx[0].author.firstName + "")) set_data_dev(t7, t7_value);
    			if ((!current || dirty & /*issue*/ 1) && t9_value !== (t9_value = /*issue*/ ctx[0].author.lastName + "")) set_data_dev(t9, t9_value);

    			if (/*issue*/ ctx[0].closed) {
    				if (if_block) ; else {
    					if_block = create_if_block_1$4(ctx);
    					if_block.c();
    					if_block.m(div5, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if ((!current || dirty & /*issue*/ 1) && raw_value !== (raw_value = marked(/*issue*/ ctx[0].description) + "")) div6.innerHTML = raw_value;			const colorbutton_changes = {};
    			if (dirty & /*issue*/ 1) colorbutton_changes.name = /*issue*/ ctx[0].closed ? "Reopen issue" : "Close issue";
    			colorbutton.$set(colorbutton_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(linkbutton.$$.fragment, local);
    			transition_in(colorbutton.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(linkbutton.$$.fragment, local);
    			transition_out(colorbutton.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div3);
    			destroy_component(linkbutton);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(div5);
    			if (if_block) if_block.d();
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(div6);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(div7);
    			destroy_component(colorbutton);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$8.name,
    		type: "slot",
    		source: "(28:4) <CenteredFlex>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$w(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*issue*/ ctx[0] && create_if_block$8(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*issue*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*issue*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$8(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$w.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$w($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("IssueView", slots, []);
    	let { params } = $$props;
    	let { projectId } = $$props;
    	let { issue } = $$props;
    	let api = new Api();

    	onMount(async () => {
    		$$invalidate(0, issue = await api.getProjectIssue(projectId, params.issueId));
    		console.log(issue.closed);
    	});

    	async function switchCloseState() {
    		$$invalidate(0, issue.closed = !issue.closed, issue);
    		$$invalidate(0, issue = await api.saveProjectIssue(projectId, issue));
    		push(`#/projects/${projectId}/issues/${issue.id}`);
    	}

    	const writable_props = ["params", "projectId", "issue"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$6.warn(`<IssueView> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("params" in $$props) $$invalidate(1, params = $$props.params);
    		if ("projectId" in $$props) $$invalidate(2, projectId = $$props.projectId);
    		if ("issue" in $$props) $$invalidate(0, issue = $$props.issue);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		CenteredFlex,
    		Api,
    		LinkButton,
    		marked,
    		ColorButton,
    		push,
    		params,
    		projectId,
    		issue,
    		api,
    		switchCloseState
    	});

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(1, params = $$props.params);
    		if ("projectId" in $$props) $$invalidate(2, projectId = $$props.projectId);
    		if ("issue" in $$props) $$invalidate(0, issue = $$props.issue);
    		if ("api" in $$props) api = $$props.api;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [issue, params, projectId, switchCloseState];
    }

    class IssueView extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$w, create_fragment$w, safe_not_equal, { params: 1, projectId: 2, issue: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "IssueView",
    			options,
    			id: create_fragment$w.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*params*/ ctx[1] === undefined && !("params" in props)) {
    			console_1$6.warn("<IssueView> was created without expected prop 'params'");
    		}

    		if (/*projectId*/ ctx[2] === undefined && !("projectId" in props)) {
    			console_1$6.warn("<IssueView> was created without expected prop 'projectId'");
    		}

    		if (/*issue*/ ctx[0] === undefined && !("issue" in props)) {
    			console_1$6.warn("<IssueView> was created without expected prop 'issue'");
    		}
    	}

    	get params() {
    		throw new Error("<IssueView>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<IssueView>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get projectId() {
    		throw new Error("<IssueView>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set projectId(value) {
    		throw new Error("<IssueView>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get issue() {
    		throw new Error("<IssueView>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set issue(value) {
    		throw new Error("<IssueView>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/routes/ProjectHome.svelte generated by Svelte v3.29.7 */
    const file$q = "src/routes/ProjectHome.svelte";

    // (8:4) {#if project}
    function create_if_block$9(ctx) {
    	let div;
    	let t_value = /*project*/ ctx[0].description + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			add_location(div, file$q, 8, 8, 150);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*project*/ 1 && t_value !== (t_value = /*project*/ ctx[0].description + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$9.name,
    		type: "if",
    		source: "(8:4) {#if project}",
    		ctx
    	});

    	return block;
    }

    // (7:0) <CenteredFlex>
    function create_default_slot$9(ctx) {
    	let if_block_anchor;
    	let if_block = /*project*/ ctx[0] && create_if_block$9(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*project*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$9(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$9.name,
    		type: "slot",
    		source: "(7:0) <CenteredFlex>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$x(ctx) {
    	let centeredflex;
    	let current;

    	centeredflex = new CenteredFlex({
    			props: {
    				$$slots: { default: [create_default_slot$9] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(centeredflex.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(centeredflex, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const centeredflex_changes = {};

    			if (dirty & /*$$scope, project*/ 3) {
    				centeredflex_changes.$$scope = { dirty, ctx };
    			}

    			centeredflex.$set(centeredflex_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(centeredflex.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(centeredflex.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(centeredflex, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$x.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$x($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ProjectHome", slots, []);
    	let { project = {} } = $$props;
    	const writable_props = ["project"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ProjectHome> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("project" in $$props) $$invalidate(0, project = $$props.project);
    	};

    	$$self.$capture_state = () => ({ CenteredFlex, project });

    	$$self.$inject_state = $$props => {
    		if ("project" in $$props) $$invalidate(0, project = $$props.project);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [project];
    }

    class ProjectHome extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$x, create_fragment$x, safe_not_equal, { project: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ProjectHome",
    			options,
    			id: create_fragment$x.name
    		});
    	}

    	get project() {
    		throw new Error("<ProjectHome>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set project(value) {
    		throw new Error("<ProjectHome>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/routes/ProjectView.svelte generated by Svelte v3.29.7 */
    const file$r = "src/routes/ProjectView.svelte";

    // (1:0) <script>     import Layout from '../c8s/Layout.svelte'     import BusyScreen from '../c8s/BusyScreen.svelte'     import {onMount}
    function create_catch_block(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(1:0) <script>     import Layout from '../c8s/Layout.svelte'     import BusyScreen from '../c8s/BusyScreen.svelte'     import {onMount}",
    		ctx
    	});

    	return block;
    }

    // (79:4) {:then ignored}
    function create_then_block(ctx) {
    	let div1;
    	let a0;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let div0;
    	let t2;
    	let div8;
    	let busyscreen;
    	let t3;
    	let div2;
    	let a1;
    	let img1;
    	let img1_src_value;
    	let t4;
    	let div4;
    	let div3;
    	let a2;
    	let t5_value = /*project*/ ctx[0].title + "";
    	let t5;
    	let a2_href_value;
    	let t6;
    	let div5;
    	let navmenu;
    	let t7;
    	let div6;
    	let t8;
    	let div7;
    	let router;
    	let current;

    	busyscreen = new BusyScreen({
    			props: { loading: /*loading*/ ctx[1] },
    			$$inline: true
    		});

    	navmenu = new NavMenu({
    			props: {
    				menuTitle: "Project Menu",
    				items: /*projectMenu*/ ctx[2]
    			},
    			$$inline: true
    		});

    	router = new Router({
    			props: {
    				routes: /*getRoutes*/ ctx[3](),
    				prefix: /^\/projects\/[0-9]+/
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			a0 = element("a");
    			img0 = element("img");
    			t0 = space();
    			div0 = element("div");
    			div0.textContent = "All projects";
    			t2 = space();
    			div8 = element("div");
    			create_component(busyscreen.$$.fragment);
    			t3 = space();
    			div2 = element("div");
    			a1 = element("a");
    			img1 = element("img");
    			t4 = space();
    			div4 = element("div");
    			div3 = element("div");
    			a2 = element("a");
    			t5 = text(t5_value);
    			t6 = space();
    			div5 = element("div");
    			create_component(navmenu.$$.fragment);
    			t7 = space();
    			div6 = element("div");
    			t8 = space();
    			div7 = element("div");
    			create_component(router.$$.fragment);
    			attr_dev(img0, "class", "w-4");
    			if (img0.src !== (img0_src_value = "/img/chevron-left.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "back");
    			add_location(img0, file$r, 81, 16, 2258);
    			attr_dev(div0, "class", "text-sm");
    			add_location(div0, file$r, 82, 16, 2331);
    			attr_dev(a0, "href", "#/projects");
    			attr_dev(a0, "class", "flex");
    			add_location(a0, file$r, 80, 12, 2207);
    			attr_dev(div1, "class", "hidden md:flex pt-2");
    			add_location(div1, file$r, 79, 8, 2161);
    			attr_dev(img1, "class", "w-6");
    			if (img1.src !== (img1_src_value = "/img/chevron-left.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "back");
    			add_location(img1, file$r, 89, 20, 2689);
    			attr_dev(a1, "href", "#/projects");
    			attr_dev(a1, "class", "flex flex-col justify-center");
    			add_location(a1, file$r, 88, 16, 2610);
    			attr_dev(div2, "class", "flex justify-center md:hidden");
    			toggle_class(div2, "bg-red-200", /*debug*/ ctx[5]);
    			add_location(div2, file$r, 87, 12, 2525);
    			attr_dev(a2, "href", a2_href_value = "#/projects/" + /*project*/ ctx[0].id);
    			add_location(a2, file$r, 94, 49, 2968);
    			attr_dev(div3, "class", "text-center text-md");
    			add_location(div3, file$r, 94, 16, 2935);
    			attr_dev(div4, "class", "col-span-4 md:col-span-5 w-full flex justify-center items-center");
    			toggle_class(div4, "bg-red-200", /*debug*/ ctx[5]);
    			add_location(div4, file$r, 92, 12, 2798);
    			attr_dev(div5, "class", "flex justify-center md:items-start md:row-span-4");
    			toggle_class(div5, "bg-red-200", /*debug*/ ctx[5]);
    			add_location(div5, file$r, 96, 12, 3059);
    			attr_dev(div6, "class", "col-span-4 col-start-2 md:col-start-1 md:col-span-5 border-t-2 border-gray-200");
    			add_location(div6, file$r, 103, 12, 3465);
    			attr_dev(div7, "class", "col-start-1 col-span-6 md:col-start-1 md:col-span-5");
    			add_location(div7, file$r, 104, 12, 3576);
    			attr_dev(div8, "class", "relative grid grid-cols-6 gap-1 mt-2 px-2");
    			add_location(div8, file$r, 85, 8, 2411);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, a0);
    			append_dev(a0, img0);
    			append_dev(a0, t0);
    			append_dev(a0, div0);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div8, anchor);
    			mount_component(busyscreen, div8, null);
    			append_dev(div8, t3);
    			append_dev(div8, div2);
    			append_dev(div2, a1);
    			append_dev(a1, img1);
    			append_dev(div8, t4);
    			append_dev(div8, div4);
    			append_dev(div4, div3);
    			append_dev(div3, a2);
    			append_dev(a2, t5);
    			append_dev(div8, t6);
    			append_dev(div8, div5);
    			mount_component(navmenu, div5, null);
    			append_dev(div8, t7);
    			append_dev(div8, div6);
    			append_dev(div8, t8);
    			append_dev(div8, div7);
    			mount_component(router, div7, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const busyscreen_changes = {};
    			if (dirty & /*loading*/ 2) busyscreen_changes.loading = /*loading*/ ctx[1];
    			busyscreen.$set(busyscreen_changes);

    			if (dirty & /*debug*/ 32) {
    				toggle_class(div2, "bg-red-200", /*debug*/ ctx[5]);
    			}

    			if ((!current || dirty & /*project*/ 1) && t5_value !== (t5_value = /*project*/ ctx[0].title + "")) set_data_dev(t5, t5_value);

    			if (!current || dirty & /*project*/ 1 && a2_href_value !== (a2_href_value = "#/projects/" + /*project*/ ctx[0].id)) {
    				attr_dev(a2, "href", a2_href_value);
    			}

    			if (dirty & /*debug*/ 32) {
    				toggle_class(div4, "bg-red-200", /*debug*/ ctx[5]);
    			}

    			if (dirty & /*debug*/ 32) {
    				toggle_class(div5, "bg-red-200", /*debug*/ ctx[5]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(busyscreen.$$.fragment, local);
    			transition_in(navmenu.$$.fragment, local);
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(busyscreen.$$.fragment, local);
    			transition_out(navmenu.$$.fragment, local);
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div8);
    			destroy_component(busyscreen);
    			destroy_component(navmenu);
    			destroy_component(router);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(79:4) {:then ignored}",
    		ctx
    	});

    	return block;
    }

    // (78:26)      {:then ignored}
    function create_pending_block(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(78:26)      {:then ignored}",
    		ctx
    	});

    	return block;
    }

    // (77:0) <Layout>
    function create_default_slot$a(ctx) {
    	let await_block_anchor;
    	let promise;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 7,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*loadProject*/ ctx[4](), info);

    	const block = {
    		c: function create() {
    			await_block_anchor = empty();
    			info.block.c();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, await_block_anchor, anchor);
    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => await_block_anchor.parentNode;
    			info.anchor = await_block_anchor;
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			{
    				const child_ctx = ctx.slice();
    				child_ctx[7] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(await_block_anchor);
    			info.block.d(detaching);
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$a.name,
    		type: "slot",
    		source: "(77:0) <Layout>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$y(ctx) {
    	let layout;
    	let current;

    	layout = new Layout({
    			props: {
    				$$slots: { default: [create_default_slot$a] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(layout.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(layout, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const layout_changes = {};

    			if (dirty & /*$$scope, project, loading*/ 259) {
    				layout_changes.$$scope = { dirty, ctx };
    			}

    			layout.$set(layout_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(layout.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(layout.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(layout, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$y.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$y($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ProjectView", slots, []);
    	let { params } = $$props;

    	let projectMenu = [
    		{
    			link: `/projects/${params.id}/issues`,
    			title: "Issues",
    			icon: "/img/document.svg"
    		},
    		{
    			link: `/projects/${params.id}/members`,
    			title: "Members",
    			icon: "/img/user-groups.svg"
    		},
    		{
    			link: `/project-edit/${params.id}`,
    			title: "Edit project"
    		}
    	];

    	let project = {};
    	let loading = true;

    	function getRoutes() {
    		return {
    			"/": wrap({
    				component: ProjectHome,
    				props: { project }
    			}),
    			"/members": ProjectMembers,
    			"/issues": wrap({
    				component: ProjectIssues,
    				props: { projectId: params.id }
    			}),
    			"/issues/new": wrap({
    				component: IssueEdit,
    				props: { projectId: params.id }
    			}),
    			"/issues/:issueId": wrap({
    				component: IssueView,
    				props: { projectId: params.id }
    			}),
    			"/issues/:issueId/edit": wrap({
    				component: IssueEdit,
    				props: { projectId: params.id }
    			})
    		};
    	}

    	onMount(async () => {
    		await loadProject();
    		$$invalidate(1, loading = false);
    	});

    	async function loadProject() {
    		let api = new Api();
    		$$invalidate(0, project = await api.getProject(params.id) || {});
    	}

    	let debug = false;
    	const writable_props = ["params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ProjectView> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("params" in $$props) $$invalidate(6, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({
    		Layout,
    		BusyScreen,
    		onMount,
    		Api,
    		NavMenu,
    		Router,
    		wrap,
    		ProjectMembers,
    		ProjectIssues,
    		IssueView,
    		IssueEdit,
    		ProjectHome,
    		params,
    		projectMenu,
    		project,
    		loading,
    		getRoutes,
    		loadProject,
    		debug
    	});

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(6, params = $$props.params);
    		if ("projectMenu" in $$props) $$invalidate(2, projectMenu = $$props.projectMenu);
    		if ("project" in $$props) $$invalidate(0, project = $$props.project);
    		if ("loading" in $$props) $$invalidate(1, loading = $$props.loading);
    		if ("debug" in $$props) $$invalidate(5, debug = $$props.debug);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [project, loading, projectMenu, getRoutes, loadProject, debug, params];
    }

    class ProjectView extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$y, create_fragment$y, safe_not_equal, { params: 6 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ProjectView",
    			options,
    			id: create_fragment$y.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*params*/ ctx[6] === undefined && !("params" in props)) {
    			console.warn("<ProjectView> was created without expected prop 'params'");
    		}
    	}

    	get params() {
    		throw new Error("<ProjectView>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<ProjectView>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const authConditions = [
        (detail => get_store_value(isAuthenticated))
    ];

    const notAuthConditions = [
        (detail => !get_store_value(isAuthenticated))
    ];

    let authRoutes = {
        '/': wrap({
            component: Home,
            conditions: authConditions
        }),
        '/login': wrap({
            component: Login,
            conditions: notAuthConditions
        }),
        '/tasks': wrap({
            component: Tasks,
            conditions: authConditions
        }),
        '/projects': wrap({
            component: Projects,
            conditions: authConditions
        }),
        '/projects/:id': wrap( {
           component:  ProjectView,
            conditions: authConditions
        }),
        '/projects/:id/edit': wrap( {
            component:  ProjectEdit,
            conditions: authConditions
        }),
        '/projects/:id/*': wrap( {
            component:  ProjectView,
            conditions: authConditions
        }),
        '/project-edit': wrap({
            component: ProjectEdit,
            conditions: authConditions
        }),
        '/project-edit/:id': wrap({
            component: ProjectEdit,
            conditions: authConditions
        }),
        '/projects/:id/issue-edit': wrap({
            component: IssueEdit,
            conditions: authConditions
        }),
        '/projects/:id/issue-edit/:id': wrap({
            component: IssueEdit,
            conditions: authConditions
        }),
        '/bar': wrap({
            component: Bar,
            conditions: authConditions
        }),
        '/workspace': wrap({
            component: Workspace,
            conditions: authConditions
        })
    };

    let anonymousRoutes = {
        '/': wrap({
            component: Login,
            //conditions: authConditions
        }),
        /*'/login': wrap({
            component: Login,
            conditions: notAuthConditions
        })*/
    };

    /* src/App.svelte generated by Svelte v3.29.7 */

    const { console: console_1$7 } = globals;

    // (49:0) {:else}
    function create_else_block_1(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(49:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (43:0) {#if $isReady}
    function create_if_block$a(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1$5, create_else_block$2];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*$isAuthenticated*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$a.name,
    		type: "if",
    		source: "(43:0) {#if $isReady}",
    		ctx
    	});

    	return block;
    }

    // (46:4) {:else}
    function create_else_block$2(ctx) {
    	let login_1;
    	let current;
    	login_1 = new Login({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(login_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(login_1, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(login_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(login_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(login_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(46:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (44:4) {#if $isAuthenticated}
    function create_if_block_1$5(ctx) {
    	let router;
    	let current;

    	router = new Router({
    			props: { routes: authRoutes },
    			$$inline: true
    		});

    	router.$on("conditionsFailed", /*onRouteConditionFailed*/ ctx[2]);

    	const block = {
    		c: function create() {
    			create_component(router.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(router, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(router, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$5.name,
    		type: "if",
    		source: "(44:4) {#if $isAuthenticated}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$z(ctx) {
    	let tailwindcss;
    	let t0;
    	let oidccontext;
    	let t1;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	tailwindcss = new Tailwindcss({ $$inline: true });

    	oidccontext = new OidcContext({
    			props: {
    				issuer: "http://keycloak:9999/auth/realms/mytrack",
    				client_id: "mytrack-spa",
    				redirect_uri: "http://localhost:5000",
    				post_logout_redirect_uri: "http://localhost:5000"
    			},
    			$$inline: true
    		});

    	const if_block_creators = [create_if_block$a, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$isReady*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			create_component(tailwindcss.$$.fragment);
    			t0 = space();
    			create_component(oidccontext.$$.fragment);
    			t1 = space();
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(tailwindcss, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(oidccontext, target, anchor);
    			insert_dev(target, t1, anchor);
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const oidccontext_changes = {};

    			if (dirty & /*$$scope*/ 8) {
    				oidccontext_changes.$$scope = { dirty, ctx };
    			}

    			oidccontext.$set(oidccontext_changes);
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tailwindcss.$$.fragment, local);
    			transition_in(oidccontext.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tailwindcss.$$.fragment, local);
    			transition_out(oidccontext.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tailwindcss, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(oidccontext, detaching);
    			if (detaching) detach_dev(t1);
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$z.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$z($$self, $$props, $$invalidate) {
    	let $isReady;
    	let $isAuthenticated;
    	validate_store(isReady, "isReady");
    	component_subscribe($$self, isReady, $$value => $$invalidate(0, $isReady = $$value));
    	validate_store(isAuthenticated, "isAuthenticated");
    	component_subscribe($$self, isAuthenticated, $$value => $$invalidate(1, $isAuthenticated = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);

    	function onRouteConditionFailed(e) {
    		console.log("onRouteConditionFailed", e.detail);
    		replace("/login");
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$7.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Tailwindcss,
    		CenteredFlex,
    		Header,
    		Navigation,
    		ProjectList,
    		Login,
    		OidcContext,
    		authError,
    		idToken,
    		accessToken,
    		isAuthenticated,
    		isLoading,
    		login,
    		logout,
    		refreshToken,
    		userInfo,
    		isReady,
    		Router,
    		authRoutes,
    		anonymousRoutes,
    		replace,
    		onRouteConditionFailed,
    		$isReady,
    		$isAuthenticated
    	});

    	return [$isReady, $isAuthenticated, onRouteConditionFailed];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$z, create_fragment$z, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$z.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
