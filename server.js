const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
app.use(express.static('public')); // Serve frontend files from 'public' folder

// ... rest of the server.js code remains the same
// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// In-memory data store
let items = [
    {
        id: 1,
        type: 'found',
        name: 'Blue Water Bottle',
        category: 'Other',
        description: 'Blue stainless steel water bottle found near the gym',
        location: 'Sports Complex',
        poster: 'John Doe',
        status: 'unclaimed',
        date: new Date().toLocaleDateString(),
        photo: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400',
        messages: []
    },
    {
        id: 2,
        type: 'lost',
        name: 'Laptop Charger',
        category: 'Electronics',
        description: 'MacBook Pro charger with USB-C cable, lost in Room 301',
        location: 'Engineering Building',
        poster: 'Jane Smith',
        status: 'unclaimed',
        date: new Date().toLocaleDateString(),
        photo: 'https://miro.medium.com/v2/resize:fit:720/format:webp/1*n35mA_P-qf8lahgwaIzEOw.jpeg',
        messages: []
    }
];

let nextId = 3;

// API Routes

// Get all items with optional filters
app.get('/api/items', (req, res) => {
    try {
        const { search, category, status, type } = req.query;
        let filtered = [...items];

        if (search) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(item =>
                item.name.toLowerCase().includes(searchLower) ||
                item.description.toLowerCase().includes(searchLower)
            );
        }

        if (category) {
            filtered = filtered.filter(item => item.category === category);
        }

        if (status) {
            filtered = filtered.filter(item => item.status === status);
        }

        if (type) {
            filtered = filtered.filter(item => item.type === type);
        }

        res.json({
            success: true,
            data: filtered,
            count: filtered.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching items',
            error: error.message
        });
    }
});

// Get single item by ID
app.get('/api/items/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const item = items.find(i => i.id === id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }

        res.json({
            success: true,
            data: item
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching item',
            error: error.message
        });
    }
});

// Create new item (with file upload)
app.post('/api/items', upload.single('photo'), (req, res) => {
    try {
        const { type, name, category, description, location, poster } = req.body;

        // Validation
        if (!type || !name || !category || !description || !location || !poster) {
            return res.status(400).json({
                success: false,
                message: 'All required fields must be provided'
            });
        }

        const newItem = {
            id: nextId++,
            type,
            name,
            category,
            description,
            location,
            poster,
            status: 'unclaimed',
            date: new Date().toLocaleDateString(),
            photo: req.file ? `http://localhost:${PORT}/uploads/${req.file.filename}` : null,
            messages: []
        };

        items.unshift(newItem);

        res.status(201).json({
            success: true,
            message: 'Item posted successfully',
            data: newItem
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating item',
            error: error.message
        });
    }
});

// Update item status
app.patch('/api/items/:id/status', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { status } = req.body;

        if (!['unclaimed', 'claimed'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value'
            });
        }

        const item = items.find(i => i.id === id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }

        item.status = status;

        res.json({
            success: true,
            message: 'Item status updated',
            data: item
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating item status',
            error: error.message
        });
    }
});

// Delete item
app.delete('/api/items/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const index = items.findIndex(i => i.id === id);

        if (index === -1) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }

        const deletedItem = items.splice(index, 1)[0];

        // Delete associated image file if it exists
        if (deletedItem.photo && deletedItem.photo.includes('/uploads/')) {
            const filename = deletedItem.photo.split('/uploads/')[1];
            const filePath = path.join(__dirname, 'uploads', filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        res.json({
            success: true,
            message: 'Item deleted successfully',
            data: deletedItem
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting item',
            error: error.message
        });
    }
});

// Add message to item
app.post('/api/items/:id/messages', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { sender, text } = req.body;

        if (!sender || !text) {
            return res.status(400).json({
                success: false,
                message: 'Sender and text are required'
            });
        }

        const item = items.find(i => i.id === id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }

        const newMessage = {
            id: item.messages.length + 1,
            sender,
            text,
            date: new Date().toLocaleString()
        };

        item.messages.push(newMessage);

        res.status(201).json({
            success: true,
            message: 'Message added successfully',
            data: newMessage
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error adding message',
            error: error.message
        });
    }
});

// Get messages for an item
app.get('/api/items/:id/messages', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const item = items.find(i => i.id === id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }

        res.json({
            success: true,
            data: item.messages,
            count: item.messages.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching messages',
            error: error.message
        });
    }
});

// Get statistics
app.get('/api/stats', (req, res) => {
    try {
        const stats = {
            total: items.length,
            lost: items.filter(i => i.type === 'lost').length,
            found: items.filter(i => i.type === 'found').length,
            unclaimed: items.filter(i => i.status === 'unclaimed').length,
            claimed: items.filter(i => i.status === 'claimed').length,
            categories: {}
        };

        items.forEach(item => {
            stats.categories[item.category] = (stats.categories[item.category] || 0) + 1;
        });

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: err.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📁 Uploads directory: ${path.join(__dirname, 'uploads')}`);
    console.log(`📊 API endpoint: http://localhost:${PORT}/api`);
});