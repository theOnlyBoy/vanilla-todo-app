/**
 * @class TodoList
 * The component is written using EcmaScript 5 spec and requires no pollyfills.
 *
 * @param {HTMLTemplateElement} itemTemplate — template element used to create a list item
 * @param {Function} errorHandler — method that's being called when error occures
 * @param {Function} changeHandler — method that's being called when list state changes
 * @constructor
 */
function TodoList(itemTemplate, errorHandler, changeHandler) {
    this.containerElement = null;
    this.itemTemplate = itemTemplate;
    this.errorHandler = errorHandler;
    this.changeHandler = changeHandler;

    this.uiState = {
        items: {},
    };
    this.state = {
        items: {},
    };
}


/** Create static parameters for class */
TodoList.ERROR_MESSAGE_EMPTY_INPUT = 'Incorrect input. Please, enter some text.';
TodoList.ERROR_MESSAGE_ITEM_EXISTS = 'Such item already exists in the list.';
TodoList.MESSAGE_NOTHING_FOUND = 'Nothing found. Hit Enter to add.';
TodoList.MESSAGE_NO_ITEMS = 'No items so far';


/** Extend class prototype */
var proto = TodoList.prototype;

/**
 * Sets a message that's shown when the list is empty. The message itself is rendered using native CSS.
 * @param {String} message
 * @private
 */
proto._setEmptyListMessage = function _setEmptyListMessage(message) {
    this.containerElement.dataset.emptyListMessage = message;
};

/**
 * Enumerates items
 * @param {Object} items
 * @param {Function} handler
 * @private
 */
proto._enumItems = function _enumItems(items, handler) {
    return Object.keys(items).forEach(function enumItem(id) {
        handler(id, items[id]);
    });
};

/**
 * Escapes HTML tags within a string
 * @param {String} text
 * @returns {string}
 * @private
 */
proto._escapeHtmlTags = function _escapeHtmlTags(text) {
    return (text || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

/**
 * Generates UUID for new items
 * @returns {string}
 * @private
 */
proto._generateItemId = function _generateId() {
    return new Date().getTime() + '_' + (Math.random() * 0x1000 | 0);
};

/**
 * Creates item HTML template
 * @param {Object} item
 * @returns {string}
 * @private
 */
proto._createItemHtml = function _createItemHtml(item) {
    return this.itemTemplate.innerHTML
        .replace(/\{\{id\}\}/g, item.id)
        .replace(/\{\{text\}\}/g, this._escapeHtmlTags(item.text));
};

/**
 * Creates item DOM element
 * @param {Object} item
 * @returns {Element}
 * @private
 */
proto._createItemElement = function _createItemElement(item) {
    var template = document.createElement('template');
    template.innerHTML = this._createItemHtml(item).trim();
    return template.content.children[0];
};

/**
 * Toggles item "Done" state
 * @param {String} id
 * @private
 */
proto._toggleItemDone = function _toggleItemDone(id) {
    var item = this.getItem(id);
    if (item) {
        item.isDone = !item.isDone;
        this._updateState();
    }
};

/**
 * Returns visible items number
 * @returns {Object[]}
 * @private
 */
proto._getVisibleItems = function _getVisibleItems() {
    return Object.values(this.state.items).filter(function checkItemVisibility(item) {
        return item.isVisible;
    });
};

/**
 * Sorts visible items
 * @returns {Object[]}
 * @private
 */
proto._getSortedVisibleItems = function _getSortedVisibleItems() {
    return this._getVisibleItems().sort(function compareItems(itemA, itemB) {
        return itemA.text.toLowerCase() > itemB.text.toLowerCase() ? 1 : -1;
    });
};

/**
 * Handles keydown event on focused list item.
 * Allow the following actions within the list: mark item as done, remove item, navigate through items..
 * @param {KeyboardEvent} event
 * @param {String} itemId
 * @private
 */
proto._onItemKeydown = function _onItemKeydown(event, itemId) {
    var keyCode = event.keyCode;
    var itemElement = event.target;

    if (keyCode === 8) { // Backspace
        var siblingItemElement = itemElement.nextSibling || itemElement.previousSibling;

        this.removeItem(itemId);
        if (siblingItemElement) {
            siblingItemElement.focus();
        }
    }
    else if (keyCode === 32) { // Space
        this._toggleItemDone(itemId);
    }
    else if (keyCode === 38) { // Up
        if (event.target.previousSibling) {
            itemElement.previousSibling.focus();
        }
        event.preventDefault(); // prevent list from unnecessary scrolling
    }
    else if (keyCode === 40) { // Down
        if (event.target.nextSibling) {
            itemElement.nextSibling.focus();
        }
        event.preventDefault(); // prevent list from unnecessary scrolling
    }
};

/**
 * Assigns events for DOM elements
 * @param containerElement
 * @private
 */
proto._assignEvents = function _assignEvents(containerElement) {
    var self = this;

    // Assign 'live' event for container element only once.
    // It'll capture all inner clicks using event bubbling.
    containerElement.addEventListener('click', function clickContainerElement(event) {
        var element = event.target;

        if (element.dataset.itemDelete) {
            // "Delete" button clicked within item
            self.removeItem(element.dataset.itemDelete);
        }
        else {
            var itemElement = element.closest('[data-item-id]');
            if (itemElement) {
                // Item itself clicked (or any element within)
                self._toggleItemDone(itemElement.dataset.itemId);
            }
        }
    });
    containerElement.addEventListener('keydown', function keydownContainerElement(event) {
        var element = event.target;
        if (event.target.dataset.itemId) {
            // Keydown on focused item element
            self._onItemKeydown(event, element.dataset.itemId);
        }
    });
};

/**
 * Updates UI representation of the list
 * @private
 */
proto._updateState = function _updateState() {
    var self = this;
    var items = this.state.items;
    var uiItems = this.uiState.items;
    var containerElement = this.containerElement;

    // Sort visible items and compare them with current UI-state creating what's missing.
    // If item doesn't exist in DOM then insert it in a particular place. If it does —> update its order index.
    var previousItemElement;
    this._getSortedVisibleItems().forEach(function createItem(item) {
        var itemId = item.id;

        if (!uiItems[itemId]) {
            var itemElement = self._createItemElement(item);
            uiItems[itemId] = itemElement;

            var nextSiblingItemElement = previousItemElement
                ? previousItemElement.nextSibling
                : containerElement.firstChild;

            if (nextSiblingItemElement) {
                containerElement.insertBefore(itemElement, nextSiblingItemElement);
            }
            else {
                containerElement.appendChild(itemElement);
            }
        }
        previousItemElement = uiItems[itemId];
    });

    // Compare UI-state with data-state and remove what doesn't exist & update items' personal states.
    this._enumItems(uiItems, function checkUiState(itemId) {
        var item = items[itemId];

        if (item) {
            uiItems[itemId].classList.toggle('done', !!item.isDone);
        }
        if (!item || !item.isVisible) {
            containerElement.removeChild(uiItems[itemId]);
            delete uiItems[itemId];
        }
    });

    // Check for visible items and set a message if list has no visible items.
    // The message will be rendered natively via CSS styles.
    if (this.getItemsCount()) {
        if (!this.getVisibleItemsCount()) {
            this._setEmptyListMessage(TodoList.MESSAGE_NOTHING_FOUND);
        }
    }
    else {
        this._setEmptyListMessage(TodoList.MESSAGE_NO_ITEMS);
    }

    // Trigger change event
    this.changeHandler && this.changeHandler();
};


// Public methods ------------------------------------------------------------------------------------------------------

/**
 * Returns total items number
 * @returns {Number}
 */
proto.getItemsCount = function getItemsCount() {
    return Object.keys(this.state.items).length;
};

/**
 * Returns visible items number
 * @returns {Number}
 */
proto.getVisibleItemsCount = function getVisibleItemsCount() {
    return this._getVisibleItems().length;
};

/**
 * Returns items that marked as "Done"
 * @returns {Object[]}
 */
proto.getDoneItems = function getDoneItems() {
    return Object.values(this.state.items).filter(function checkItemIsDone(item) {
        return item.isDone;
    });
};

/**
 * Returns item by its ID
 * @param {String} id
 * @returns {Object}
 */
proto.getItem = function getItem(id) {
    return this.state.items[id];
};

/**
 * Scroll the list to specified item
 * @param {String} itemId
 */
proto.scrollToItem = function scrollToItem(itemId) {
    var itemElement = this.uiState.items[itemId];
    if (itemElement) {
        this.containerElement.scrollTop = itemElement.offsetTop - 50;
    }
};

/**
 * Searches items by their text by doing a strict comparison.
 * @param {String} text
 * @returns {Object[]}
 */
proto.getItemsByText = function getItemsByText(text) {
    var searchableText = (text || '').trim().toLowerCase();

    return Object.values(this.state.items).filter(function checkItemText(item) {
        return item.text.toLowerCase() === searchableText;
    });
};

/**
 * Exports list state
 * @returns {Object}
 */
proto.getRawState = function getRawState() {
    return JSON.parse(JSON.stringify(this.state));
};

/**
 * Imports list state
 * @param {Object} state
 */
proto.setRawState = function getRawState(state) {
    this.state = state;
    this._updateState();
};

/**
 * Adds a new item to the list
 * @param {String} text
 * @returns {String|null}
 */
proto.addItem = function addItem(text) {
    var itemText = (text || '').trim();

    // Check for empty text value
    if (!itemText) {
        this.errorHandler && this.errorHandler(TodoList.ERROR_MESSAGE_EMPTY_INPUT);
        return null;
    }

    // Search items with such text value
    var foundItems = this.getItemsByText(itemText);
    if (foundItems && foundItems[0]) {
        this.errorHandler && this.errorHandler(TodoList.ERROR_MESSAGE_ITEM_EXISTS);
        return null;
    }

    // Create date for new item
    var itemId = this._generateItemId();
    this.state.items[itemId] = {
        id: itemId,
        text: itemText,
        isVisible: true,
        isDone: false,
    };

    this._updateState();
    return itemId;
};

/**
 * Removes item from the list
 * @param {String} id
 * @returns {Boolean}
 */
proto.removeItem = function removeItem(id) {
    if (this.state.items[id]) {
        delete this.state.items[id];
        this._updateState();
        return true;
    }
    return false;
};

/**
 * Filters items within the list by their text.
 * If search string contains only 1 symbol then it'll be filtering by the first symbol in items text (alphabetical).
 * Otherwise it'll be filtering by a substring within items text.
 * @param {String} text
 */
proto.filterItems = function filterItems(text) {
    var searchableText = (text || '').trim().toLowerCase();
    var hasText = !!searchableText.length;
    var searchByFirstLetter = searchableText.length === 1;

    this._enumItems(this.state.items, function setItemVisibility(itemId, item) {
        if (hasText) {
            item.isVisible = searchByFirstLetter
                ? item.text.charAt(0).toLowerCase() === searchableText
                : item.text.toLowerCase().indexOf(searchableText) > -1;
        }
        else {
            item.isVisible = true;
        }
    });
    this._updateState();
};

/**
 * Renders the list within specified container element.
 * @param {HTMLElement} containerElement
 */
proto.render = function render(containerElement) {
    if (!this.containerElement) {
        this.containerElement = containerElement;
        this._assignEvents(this.containerElement);
        this._updateState();
    }
    else {
        throw Error('Class instance `TodoList` has been already rendered in DOM.');
    }
};

/**
 * Clears the list by removing all items
 */
proto.clear = function clear() {
    this.state.items = {};
    this._updateState();
};

module.exports = TodoList;
