// Data structures
let books = JSON.parse(localStorage.getItem('libraryBooks')) || [];
let members = JSON.parse(localStorage.getItem('libraryMembers')) || [];
let transactions = JSON.parse(localStorage.getItem('libraryTransactions')) || [];

// DOM Elements
const tabLinks = document.querySelectorAll('nav a');
const tabContents = document.querySelectorAll('.tab-content');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeTabs();
    loadDashboard();
    loadBooks();
    loadMembers();
    loadTransactions();
    setupEventListeners();
});

// Tab Navigation
function initializeTabs() {
    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const tabId = this.getAttribute('data-tab');
            
            // Update active tab
            tabLinks.forEach(link => link.classList.remove('active'));
            this.classList.add('active');
            
            // Show active content
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
            
            // Refresh data if needed
            if (tabId === 'dashboard') loadDashboard();
            if (tabId === 'books') loadBooks();
            if (tabId === 'members') loadMembers();
            if (tabId === 'transactions') loadTransactions();
        });
    });
}

// Dashboard Functions
function loadDashboard() {
    const totalBooks = books.reduce((sum, book) => sum + book.copies, 0);
    const totalMembers = members.length;
    const borrowedBooks = transactions.filter(t => t.status === 'borrowed').length;
    const overdueBooks = transactions.filter(t => {
        if (t.status === 'borrowed') {
            const dueDate = new Date(t.dueDate);
            const today = new Date();
            return dueDate < today;
        }
        return false;
    }).length;
    
    document.getElementById('total-books').textContent = totalBooks;
    document.getElementById('total-members').textContent = totalMembers;
    document.getElementById('borrowed-books').textContent = borrowedBooks;
    document.getElementById('overdue-books').textContent = overdueBooks;
}

// Book Management Functions
function loadBooks() {
    const booksList = document.getElementById('books-list');
    booksList.innerHTML = '';
    
    books.forEach(book => {
        const availableCopies = book.copies - transactions.filter(t => 
            t.bookId === book.id && t.status === 'borrowed').length;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td>${book.isbn}</td>
            <td>${availableCopies}</td>
            <td>
                <button class="action-btn edit-btn" data-id="${book.id}">Edit</button>
                <button class="action-btn delete-btn" data-id="${book.id}">Delete</button>
            </td>
        `;
        booksList.appendChild(row);
    });
    
    // Update borrow book dropdown
    const borrowBookSelect = document.getElementById('borrow-book');
    borrowBookSelect.innerHTML = '<option value="">Select Book</option>';
    
    books.forEach(book => {
        const availableCopies = book.copies - transactions.filter(t => 
            t.bookId === book.id && t.status === 'borrowed').length;
        
        if (availableCopies > 0) {
            const option = document.createElement('option');
            option.value = book.id;
            option.textContent = `${book.title} by ${book.author}`;
            borrowBookSelect.appendChild(option);
        }
    });
}

// Member Management Functions
function loadMembers() {
    const membersList = document.getElementById('members-list');
    membersList.innerHTML = '';
    
    members.forEach(member => {
        const borrowedCount = transactions.filter(t => 
            t.memberId === member.id && t.status === 'borrowed').length;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${member.name}</td>
            <td>${member.email}</td>
            <td>${member.phone || 'N/A'}</td>
            <td>${borrowedCount}</td>
            <td>
                <button class="action-btn edit-btn" data-id="${member.id}">Edit</button>
                <button class="action-btn delete-btn" data-id="${member.id}">Delete</button>
            </td>
        `;
        membersList.appendChild(row);
    });
    
    // Update borrow member dropdown
    const borrowMemberSelect = document.getElementById('borrow-member');
    borrowMemberSelect.innerHTML = '<option value="">Select Member</option>';
    
    members.forEach(member => {
        const option = document.createElement('option');
        option.value = member.id;
        option.textContent = member.name;
        borrowMemberSelect.appendChild(option);
    });
}

// Transaction Management Functions
function loadTransactions() {
    const transactionsList = document.getElementById('transactions-list');
    transactionsList.innerHTML = '';
    
    // Update return transaction dropdown
    const returnTransactionSelect = document.getElementById('return-transaction');
    returnTransactionSelect.innerHTML = '<option value="">Select Transaction</option>';
    
    transactions.forEach(transaction => {
        const book = books.find(b => b.id === transaction.bookId);
        const member = members.find(m => m.id === transaction.memberId);
        
        if (book && member) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${member.name}</td>
                <td>${book.title}</td>
                <td>${formatDate(transaction.borrowDate)}</td>
                <td>${formatDate(transaction.dueDate)}</td>
                <td>${transaction.returnDate ? formatDate(transaction.returnDate) : 'Not returned'}</td>
                <td>${transaction.status}</td>
            `;
            transactionsList.appendChild(row);
            
            // Add to return dropdown if not returned
            if (transaction.status === 'borrowed') {
                const option = document.createElement('option');
                option.value = transaction.id;
                option.textContent = `${member.name} - ${book.title}`;
                returnTransactionSelect.appendChild(option);
            }
        }
    });
}

// Event Listeners
function setupEventListeners() {
    // Add book form
    document.getElementById('add-book-form').addEventListener('submit', function(e) {
        e.preventDefault();
        addBook();
    });
    
    // Add member form
    document.getElementById('add-member-form').addEventListener('submit', function(e) {
        e.preventDefault();
        addMember();
    });
    
    // Borrow book form
    document.getElementById('borrow-book-form').addEventListener('submit', function(e) {
        e.preventDefault();
        borrowBook();
    });
    
    // Return book form
    document.getElementById('return-book-form').addEventListener('submit', function(e) {
        e.preventDefault();
        returnBook();
    });
    
    // Search books
    document.getElementById('search-books').addEventListener('click', function() {
        searchBooks();
    });
    
    // Modal close button
    document.querySelector('.close').addEventListener('click', function() {
        document.getElementById('modal').style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('modal');
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Set default dates for borrowing
    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + 14); // 2 weeks from today
    
    document.getElementById('borrow-date').value = formatDateForInput(today);
    document.getElementById('due-date').value = formatDateForInput(dueDate);
    document.getElementById('return-date').value = formatDateForInput(today);
}

// Add a new book
function addBook() {
    const title = document.getElementById('book-title').value;
    const author = document.getElementById('book-author').value;
    const isbn = document.getElementById('book-isbn').value;
    const copies = parseInt(document.getElementById('book-copies').value);
    
    const newBook = {
        id: generateId(),
        title,
        author,
        isbn,
        copies
    };
    
    books.push(newBook);
    saveData();
    loadBooks();
    showModal('Book added successfully!');
    
    // Reset form
    document.getElementById('add-book-form').reset();
}

// Add a new member
function addMember() {
    const name = document.getElementById('member-name').value;
    const email = document.getElementById('member-email').value;
    const phone = document.getElementById('member-phone').value;
    
    const newMember = {
        id: generateId(),
        name,
        email,
        phone
    };
    
    members.push(newMember);
    saveData();
    loadMembers();
    showModal('Member added successfully!');
    
    // Reset form
    document.getElementById('add-member-form').reset();
}

// Borrow a book
function borrowBook() {
    const memberId = document.getElementById('borrow-member').value;
    const bookId = document.getElementById('borrow-book').value;
    const borrowDate = document.getElementById('borrow-date').value;
    const dueDate = document.getElementById('due-date').value;
    
    const book = books.find(b => b.id === bookId);
    const availableCopies = book.copies - transactions.filter(t => 
        t.bookId === bookId && t.status === 'borrowed').length;
    
    if (availableCopies < 1) {
        showModal('No copies available for borrowing!');
        return;
    }
    
    const newTransaction = {
        id: generateId(),
        bookId,
        memberId,
        borrowDate,
        dueDate,
        returnDate: null,
        status: 'borrowed'
    };
    
    transactions.push(newTransaction);
    saveData();
    loadTransactions();
    loadBooks();
    showModal('Book borrowed successfully!');
    
    // Reset form
    document.getElementById('borrow-book-form').reset();
    
    // Set default dates
    const today = new Date();
    const newDueDate = new Date();
    newDueDate.setDate(today.getDate() + 14);
    
    document.getElementById('borrow-date').value = formatDateForInput(today);
    document.getElementById('due-date').value = formatDateForInput(newDueDate);
}

// Return a book
function returnBook() {
    const transactionId = document.getElementById('return-transaction').value;
    const returnDate = document.getElementById('return-date').value;
    
    const transaction = transactions.find(t => t.id === transactionId);
    
    if (transaction) {
        transaction.returnDate = returnDate;
        transaction.status = 'returned';
        
        saveData();
        loadTransactions();
        loadBooks();
        showModal('Book returned successfully!');
        
        // Reset form
        document.getElementById('return-book-form').reset();
        document.getElementById('return-date').value = formatDateForInput(new Date());
    }
}

// Search books
function searchBooks() {
    const searchTerm = document.getElementById('book-search').value.toLowerCase();
    
    if (!searchTerm) {
        loadBooks();
        return;
    }
    
    const filteredBooks = books.filter(book => 
        book.title.toLowerCase().includes(searchTerm) ||
        book.author.toLowerCase().includes(searchTerm) ||
        book.isbn.toLowerCase().includes(searchTerm)
    );
    
    const booksList = document.getElementById('books-list');
    booksList.innerHTML = '';
    
    filteredBooks.forEach(book => {
        const availableCopies = book.copies - transactions.filter(t => 
            t.bookId === book.id && t.status === 'borrowed').length;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td>${book.isbn}</td>
            <td>${availableCopies}</td>
            <td>
                <button class="action-btn edit-btn" data-id="${book.id}">Edit</button>
                <button class="action-btn delete-btn" data-id="${book.id}">Delete</button>
            </td>
        `;
        booksList.appendChild(row);
    });
}

// Utility Functions
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function saveData() {
    localStorage.setItem('libraryBooks', JSON.stringify(books));
    localStorage.setItem('libraryMembers', JSON.stringify(members));
    localStorage.setItem('libraryTransactions', JSON.stringify(transactions));
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function formatDateForInput(date) {
    return date.toISOString().split('T')[0];
}

function showModal(message) {
    document.getElementById('modal-message').textContent = message;
    document.getElementById('modal').style.display = 'block';
}