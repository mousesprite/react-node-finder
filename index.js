/**
 * Created by sulin on 16/7/24.
 */
import React from 'react';

// This kind of Componenet need be ignored, works with react-dom and react-native.
const IGNORED_COMPONENTS = ['StatelessComponent', 'Constructor', 'AnimatedComponent']

/**
 * search first parent in node-tree structure.
 * @param node  search from
 * @param pType parent type
 * @returns {Array || null}
 */
export function findParent(node, pType) {
    let parentNode = _getParent(node);
    let instance = _getValidComponent(parentNode);
    while (parentNode && (!instance || (pType && !(instance instanceof pType)))) {
        parentNode = _getParent(parentNode);
        instance = _getValidComponent(parentNode);
    }
    return instance;
}

/**
 * search all parent in node-tree structure.
 * @param node  search from
 * @param pType parent type
 * @returns {Array || null}
 */
export function findAllParent(node, pType) {
    let parents = [];
    let parent = _getParent(node);
    while (parent) {
        parents.push(parent);
        parent = _getParent(parent);
    }
    parents = _filterComponent(parents, pType);
    return parents ? parents.reverse() : null;
}

/**
 * search all child-component in node-tree structure
 * @param node      search from
 * @param childType child type
 * @returns {Array || null}
 */
export function findAllChildren(node, childType) {
    let children = _getAllChildren(node);
    return _filterComponent(children, childType);
}

export function findTreeChildren(node,filter) {
	let tree = _getTreeChildren(node, null, filter);
	return tree;
}

// get parent
function _getParent(node) {
    if (node instanceof React.Component) {
        node = node._reactInternalInstance;
    }
    let owner = node && node._currentElement._owner;
    let parentNode = node && node._hostParent;
    // location real parent node based on owner
    while (owner && parentNode && parentNode._currentElement._owner._mountOrder != owner._mountOrder) {
        parentNode = parentNode._currentElement._owner;
        if (parentNode._currentElement._owner._mountOrder < owner._mountOrder) {
            parentNode = null;
            break;
        }
    }
    return parentNode || owner;
}

// get all children Component by ricursion
function _getAllChildren(node) {
    if (node instanceof React.Component) {
        node = node._reactInternalInstance;
    }
    let children = [];
    if (node._renderedComponent) {
        children.push(node._renderedComponent);
        let deeper = _getAllChildren(node._renderedComponent);
        (deeper && deeper.length) && (children = children.concat(deeper));
    } else if (node._renderedChildren) {
        for (let key in node._renderedChildren) {
            if (node._renderedChildren.hasOwnProperty(key) && key.indexOf('.') == 0) {
                let child = node._renderedChildren[key];
                children.push(child);
                let deeper = _getAllChildren(child);
                (deeper && deeper.length) && (children = children.concat(deeper));
            }
        }
    }
    return children;
}

function _getTreeChildren(node, rootNode, filterFunction) {
	if (node instanceof React.Component) {
        node = node._reactInternalInstance;
    }
    let vnode = {children: []}

    if (!rootNode) {
    	rootNode = vnode;
    };
    if (node._renderedComponent) {

        let comInstance = _getFilteredValidComponent(node._renderedComponent, filterFunction);

        let sub = {children: []}
        if (comInstance) {

            sub.currentInstance = comInstance;

            rootNode.children.push(sub);

            _getTreeChildren(node._renderedComponent, sub, filterFunction);
        } else {
            _getTreeChildren(node._renderedComponent, rootNode, filterFunction);
        }

    } else if (node._renderedChildren) {

        for (let key in node._renderedChildren) {
            if (node._renderedChildren.hasOwnProperty(key) && key.indexOf('.') == 0) {
                let child = node._renderedChildren[key];

                let inst = _getFilteredValidComponent(child, filterFunction);
                let subnode = {children: []};
                if (inst) {

                    _getTreeChildren(child, subnode, filterFunction);

                    subnode.currentInstance = inst;

                    rootNode.children.push(subnode);

                } else {
                    _getTreeChildren(child, rootNode, filterFunction);
                }
            }
        }
    }
    return rootNode;
}

// filter the component that we real need.
function _filterComponent(nodes, childType) {
    let result = null;
    if (nodes && nodes.length) {
        let filterResult = [];
        nodes.forEach(function (item) {
            let instance = _getValidComponent(item);
            if (instance && (!childType || (instance instanceof childType))) {
                filterResult.push(instance);
            }
        });
        if (filterResult.length) {
            result = filterResult;
        }
    }
    return result;
}

function _getFilteredValidComponent(component, filterFunction) {

	if (!component) {
		return null;
	};

	let  instance = _getValidComponent(component);
    if (instance && (!filterFunction || filterFunction(instance) === true)) {
        return instance;
    }
    return null;
}

// get valid component and ignore common component, if node is ReactCompositeComponentWrapper then get _instance.
function _getValidComponent(node) {
    if (node && (node.constructor.name == 'ReactCompositeComponentWrapper' || node.__proto__.constructor.name == 'ReactCompositeComponentWrapper')) {
        node = node._instance;
    }
    if (node && IGNORED_COMPONENTS.indexOf(node.constructor.name) >= 0) {
        node = null;
    }
    return node;
}