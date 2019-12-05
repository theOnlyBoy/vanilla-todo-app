import TodoList from './components/TodoList';

(function App() {
    var formElement = $('#todoForm');
    var inputElement = $('#todoInput');
    var inputErrorElement = $('#inputError');
    var submitButtonElement = $('#todoSubmitButton');
    var progressBarElement = $('#todoProgressBar');
    var todoList = new TodoList($('#todoItemTemplate'), showInputError, onTodoListChange);

    // Methods ---------------------------------------------------------------------------------------------------------

    /**
     * Selects DOM element by query string
     * @param {String} selector
     * @returns {HTMLElement}
     */
    function $(selector) {
        return document.querySelector(selector);
    }


    /**
     * Shows error message for input element
     * @param {String} errorText
     */
    function showInputError(errorText) {
        inputElement.classList.remove('invalid');

        // Break workflow to re-assign CSS class, it'll restart the animation in case the error is already visible
        setTimeout(function toggleInvalidInput() {
            inputElement.classList.toggle('invalid', !!errorText);
        }, 0);

        inputErrorElement.textContent = errorText;
        inputErrorElement.hidden = !errorText;
    }

    // Event handlers --------------------------------------------------------------------------------------------------

    /**
     * Handler for form submission event
     * @param {Event} event
     */
    function onTodoFormSubmit(event) {
        var itemId = todoList.addItem(inputElement.value.trim());

        if (itemId) {
            inputElement.value = '';
            onInputChange();
            todoList.scrollToItem(itemId);
        }
        event.preventDefault();
    }

    /** Handler for input change event */
    function onInputChange() {
        todoList.filterItems(inputElement.value);
        submitButtonElement.disabled = !inputElement.value.trim();

        if (inputElement.classList.contains('invalid')) {
            showInputError(null);
        }
    }

    /**
     * Handler for input keydown event.
     * Esc key is handled natively by a browser because the input is of type "search". Convenient ;-)
     * @param {Event} event
     */
    function onInputKeydown(event) {
        if (event.keyCode === 13) { // Enter
            if (!inputElement.value.trim()) {
                showInputError(TodoList.ERROR_MESSAGE_EMPTY_INPUT);
                event.preventDefault();
            }
        }
    }

    /**
     * Emits when list data is changed and updates the progress of done items in the list
     */
    function onTodoListChange() {
        var itemsCount = todoList.getItemsCount();
        var doneItemsCount = todoList.getDoneItems().length;
        progressBarElement.style.width = doneItemsCount / itemsCount * 100 + '%';

        // If no items left in the list then put a focus on form input
        if (!itemsCount) {
            inputElement.focus();
        }
    }

    /**
     * Exports list state to local storage
     */
    function saveTodoListState() {
        if (window.localStorage) {
            localStorage.setItem('todoListData', JSON.stringify(todoList.getRawState()));
        }
        else {
            alert('Your browser doesn\'t support `localStorage`.\nThat\'s fine, but the data won\'t be saved.');
        }
    }

    /**
     * Imports list state from storage
     */
    function loadTodoListState() {
        if (window.localStorage) {
            var state;
            try {
                state = JSON.parse(localStorage.getItem('todoListData'));
            }
            catch (e) {
                // do nothing
            }
            if (state) {
                todoList.setRawState(state);
            }
        }
    }

    // Initialization --------------------------------------------------------------------------------------------------
    (function initApp() {
        window.addEventListener('unload', saveTodoListState);
        formElement.addEventListener('submit', onTodoFormSubmit);
        inputElement.addEventListener('input', onInputChange);
        inputElement.addEventListener('keydown', onInputKeydown);

        inputElement.disabled = false;
        todoList.render($('#todoList'));

        loadTodoListState();
    })();
})();
