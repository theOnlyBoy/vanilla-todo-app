const TodoList = require('../js/components/TodoList');

describe('TodoList class tests', () => {
    test('Check _enumItems() method', () => {
        // Method `_enumItems()`
        const items = {
            'itemA': 'valueA',
            'itemB': 'valueB',
            'itemC': 'valueC',
        };
        const enumItemsResult = [];
        TodoList.prototype._enumItems(items, (key, value) => enumItemsResult.push(key, value));
        expect(enumItemsResult.join(',')).toBe('itemA,valueA,itemB,valueB,itemC,valueC');
    });

    test('Check _escapeHtmlTags() method', () => {
        const html = 'Text <a href="#">link tag</a> after\n<p>second line</p>';
        const escapedHtml = TodoList.prototype._escapeHtmlTags(html);
        expect(escapedHtml).toBe('Text &lt;a href="#"&gt;link tag&lt;/a&gt; after\n&lt;p&gt;second line&lt;/p&gt;');
    });

    test('Check _generateItemId() method', () => {
        const itemUID = TodoList.prototype._generateItemId();
        expect(/^[0-9]+_[0-9]+$/.test(itemUID)).toBe(true);
    });
});

describe('TodoList component tests', () => {
    let todoList;

    beforeEach(() => {
        document.body.innerHTML = `
            <ul id="todoList" class="todoList" role="list"></ul>
            
            <template id="todoItemTemplate">
                <li class="todoList__item" data-item-id="{{id}}" role="listitem" tabindex="0">
                    <div class="todoList__itemText" data-item-text>{{text}}</div>
                    <div class="todoList__itemControls">
                        <input type="button" class="todoList__itemDeleteButton"
                               data-item-delete="{{id}}" title="Remove item">
                    </div>
                </li>
            </template>
        `;

        todoList = new TodoList(document.getElementById('todoItemTemplate'), null, null);
        todoList.render(document.getElementById('todoList'));
    });

    test('Component works', () => {
        expect(todoList).toBeInstanceOf(TodoList);
        expect(todoList.state).toStrictEqual({ items: {} });
        expect(todoList.uiState).toStrictEqual({ items: {} });
    });

    test('Component has correct message for empty state', () => {
        const containerElement = todoList.containerElement;
        expect(containerElement.dataset.emptyListMessage).toBe(TodoList.MESSAGE_NO_ITEMS);
    });

    test('Component adds/removes items correctly', () => {
        todoList.addItem('Test item C');
        todoList.addItem('Test item B');
        todoList.addItem('Test item A');

        // Check items are added with a correct order
        let itemElements = document.querySelectorAll('#todoList li');
        expect(itemElements.length).toBe(3);
        expect(itemElements[0].children[0].textContent).toBe('Test item A');
        expect(itemElements[1].children[0].textContent).toBe('Test item B');
        expect(itemElements[2].children[0].textContent).toBe('Test item C');

        // Delete items
        itemElements[1].querySelector('[data-item-delete]').click(); // click "Delete" button
        itemElements = document.querySelectorAll('#todoList li');
        expect(itemElements.length).toBe(2);
        expect(itemElements[0].children[0].textContent).toBe('Test item A');
        expect(itemElements[1].children[0].textContent).toBe('Test item C');
    });

    test('Component filters items correctly', () => {
        todoList.addItem('Apple');
        todoList.addItem('Orange');
        todoList.addItem('Mango shake');
        todoList.addItem('Mango');
        todoList.addItem('World');

        expect(todoList.getItemsCount()).toBe(5);
        expect(todoList.getVisibleItemsCount()).toBe(5);

        todoList.filterItems('mAng');


        // Check if items are filtered correctly
        let itemElements = document.querySelectorAll('#todoList li');
        expect(itemElements.length).toBe(2);
        expect(itemElements[0].children[0].textContent).toBe('Mango');
        expect(itemElements[1].children[0].textContent).toBe('Mango shake');

        expect(todoList.getVisibleItemsCount()).toBe(2);
        expect(todoList.getItemsCount()).toBe(5);


        // Check a message when no items are visible after filtering
        const containerElement = todoList.containerElement;
        todoList.filterItems('monkey');

        itemElements = document.querySelectorAll('#todoList li');
        expect(itemElements.length).toBe(0);
        expect(containerElement.dataset.emptyListMessage).toBe(TodoList.MESSAGE_NOTHING_FOUND);

        expect(todoList.getVisibleItemsCount()).toBe(0);
        expect(todoList.getItemsCount()).toBe(5);
    });

    test('Component marks items as done', () => {
        todoList.addItem('Apple');
        todoList.addItem('Orange');

        // Check if clicked item is toggling is "Done" state
        let itemElements = document.querySelectorAll('#todoList li');
        const itemElement = itemElements[0];

        expect(itemElement.classList.contains('done')).toBe(false);
        expect(todoList.getDoneItems().length).toBe(0);

        itemElement.click();
        expect(itemElement.classList.contains('done')).toBe(true);
        expect(todoList.getDoneItems().length).toBe(1);

        itemElement.click();
        expect(itemElement.classList.contains('done')).toBe(false);
        expect(todoList.getDoneItems().length).toBe(0);
    });

    test('Component searches items by text', () => {
        todoList.addItem('Pie of apples');
        todoList.addItem('Apple');
        todoList.addItem('Mango');
        todoList.addItem('Apple juice');

        expect(todoList.getItemsByText('apple').length).toBe(1);
        expect(todoList.getItemsByText('apples').length).toBe(0);
        expect(todoList.getItemsByText('orange').length).toBe(0);
    });

    test('Component exports/imports its state', () => {
        todoList.addItem('Apple');
        todoList.addItem('Orange');
        todoList.addItem('Mango');
        expect(todoList.getItemsCount()).toBe(3);

        // Save list state & clear the list
        const rawState = todoList.getRawState();
        todoList.clear();
        expect(todoList.getItemsCount()).toBe(0);

        // Set saved list state
        todoList.setRawState(rawState);
        expect(todoList.getItemsCount()).toBe(3);
    });
});
