import { Selector } from 'testcafe';

export default (selector) => {
    if (selector !== void 0 && typeof selector !== 'string')
        throw new Error(`If the selector parameter is passed it should be a string, but it was ${typeof selector}`);

    return Selector(complexSelector => {
        function validateVueVersion () {
            const SUPPORTED_VUE_VERSION = 2;
            const vueVersion            = parseInt(window.Vue.version.split('.')[0], 10);

            if (vueVersion < SUPPORTED_VUE_VERSION)
                throw new Error('testcafe-vue-selectors supports Vue version 2.x and newer');
        }

        function walkDomNodes (node, fn) {
            if (node.childNodes) {
                for (let i = 0; i < node.childNodes.length; i++) {
                    const childNode       = node.childNodes[i];
                    const isInstanceFound = fn(childNode);

                    if (!isInstanceFound)
                        walkDomNodes(childNode, fn);
                    else
                        break;
                }
            }
        }

        function findFirstRootInstance () {
            let instance = null;

            walkDomNodes(document, node => {
                instance = node.__vue__;

                return !!instance;
            });

            return instance;
        }

        function getComponentTagNames (componentSelector) {
            return componentSelector
                .split(' ')
                .filter(el => !!el)
                .map(el => el.trim().toLowerCase());
        }

        function getComponentTag (instance) {
            return instance.$options.name ||
                   instance.$options._componentTag ||
                   instance.$options.__file ||
                   '';
        }

        function filterNodes (root, tags) {
            const foundComponents = [];

            function walkVueComponentNodes (node, tagIndex, checkFn) {
                if (checkFn(node, tagIndex)) {
                    if (tagIndex === tags.length - 1) {
                        foundComponents.push(node.$el);
                        return;
                    }

                    tagIndex++;
                }

                for (let i = 0; i < node.$children.length; i++) {
                    const childNode = node.$children[i];

                    walkVueComponentNodes(childNode, tagIndex, checkFn);
                }
            }

            walkVueComponentNodes(root, 0, (node, tagIndex) => tags[tagIndex] === getComponentTag(node));

            return foundComponents;
        }

        if (!window.Vue)
            return document.querySelectorAll(complexSelector);

        validateVueVersion();

        const rootInstance = findFirstRootInstance();

        if (!rootInstance)
            return null;

        if (!complexSelector)
            return rootInstance.$el;

        const componentTags = getComponentTagNames(complexSelector);

        return filterNodes(rootInstance, componentTags);
    })(selector).addCustomMethods({
        getVueProps: (node, name) => {
            function getProps (instance) {
                const result   = {};
                const vueProps = instance.$options.props || {};

                Object.keys(vueProps).forEach(key => {
                    result[key] = instance[key];
                });

                return result;
            }

            const nodeVueInstance = node.__vue__;

            if (!nodeVueInstance)
                return null;

            const props = getProps(nodeVueInstance);

            return props[name];
        },
        getVueState: (node, name) => {
            function getState (instance) {
                const props   = instance._props || instance.$options.props;
                const getters = instance.$options.vuex && instance.$options.vuex.getters;
                const result  = {};

                Object.keys(instance._data)
                    .filter(key => !(props && key in props) && !(getters && key in getters))
                    .forEach(key => {
                        result[key] = instance._data[key];
                    });

                return result;
            }

            const nodeVueInstance = node.__vue__;

            if (!nodeVueInstance)
                return null;

            const state = getState(nodeVueInstance);

            return state[name];
        },
        getVueComputed: (node, name) => {
            function getComputed (instance) {
                const result      = {};
                const vueComputed = instance.$options.computed || {};

                Object.keys(vueComputed).forEach(key => {
                    result[key] = instance[key];
                });

                return result;
            }

            const nodeVueInstance = node.__vue__;

            if (!nodeVueInstance)
                return null;

            const computed = getComputed(nodeVueInstance);

            return computed[name];
        }
    });
};

