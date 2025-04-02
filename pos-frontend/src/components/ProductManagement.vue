<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { connection } from '@/api/axios'
import {
    MagnifyingGlassIcon,
    PlusIcon,
    PencilIcon,
    TrashIcon,
    XMarkIcon,
    CheckIcon,
    CubeIcon,
    CurrencyDollarIcon,
    BuildingStorefrontIcon,
    EyeIcon,
    TagIcon,
    TruckIcon,
    BuildingOfficeIcon,
    ArrowsUpDownIcon,
    FunnelIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    ArrowPathIcon,
    ArrowDownTrayIcon
} from '@heroicons/vue/24/outline'
import Header from './Header.vue'
import Sidebar from './Sidebar.vue'
import Swal from 'sweetalert2'
import GRNDocument from './GRNDocument.vue'

const isSidebarVisible = ref(false)
const toggleSidebar = (visible) => {
    isSidebarVisible.value = visible
}

const showModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const showViewModal = ref(false)
const showGRN = ref(false)
const grnProduct = ref(null)
const grnNumber = ref('')

const newProduct = ref({
    name: '',
    price: '',
    seller_price: '',
    discount: '', 
    selling_discount: '', 
    tax: '',
    size: '',
    color: '',
    description: '',
    bar_code: '',
    brand_name: '',
    inventory_id: '',
    supplier_id: '',
    admin_id: '',
    calculate_length: false
})
const editingProduct = ref({
    calculate_length: false
})
const productToDelete = ref(null)
const viewingProduct = ref(null)

const searchQuery = ref('')
const categoryFilter = ref('')
const supplierFilter = ref('')
const brandFilter = ref('')
const sortField = ref('id')
const sortDirection = ref('asc')

const newCategory = ref('')
const newSupplier = ref('')
const newBrand = ref('')
const showCategoryInput = ref(false)
const showSupplierInput = ref(false)
const showBrandInput = ref(false)

const formErrors = ref({})
const touchedFields = ref({}) 

const selectedProducts = ref([])
const uploadedFile = ref(null)
const pagination = ref({
    total: 0,
    currentPage: 1,
    perPage: 10
})

const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(value)
}

const validateInput = (field, value) => {
    if (!touchedFields.value[field]) return true

    
    if (typeof value === 'string' && /<script>/i.test(value)) {
        formErrors.value[field] = 'Invalid characters in field'
        return false
    }

    if (!value && value !== 0) {
        formErrors.value[field] = 'This field is required'
        return false
    }


    const numericFields = ['price', 'seller_price', 'tax', 'inventory_id', 'supplier_id', 'admin_id', 'discount', 'selling_discount']; // Add selling_discount
    if (numericFields.includes(field)) {
        const numValue = Number(value)
        if (isNaN(numValue)) {
            formErrors.value[field] = 'This field must be a number'
            return false
        }
    }

    formErrors.value[field] = ''
    return true
}

const markFieldAsTouched = (field) => {
    touchedFields.value[field] = true
    validateInput(field, newProduct.value[field])
}

// Only validate required fields
const validateForm = (product) => {
    const requiredFields = ['name', 'description', 'price', 'seller_price']
    let isValid = true

    requiredFields.forEach(field => {
        if (!validateInput(field, product[field])) {
            isValid = false
        }
    })

    return isValid
}

const products = ref([])
const isLoading = ref(true)
const isAddingProduct = ref(false)
const isUpdatingProduct = ref(false)

const fetchProducts = async () => {
    isLoading.value = true
    try {
        const response = await connection.get('/products')
        products.value = response.data.data.map(product => {
            const sellerPriceWithDiscount = product.seller_price * (1 - product.discount / 100)
            const normalPriceWithSellingDiscount = product.price * (1 - product.selling_discount / 100)
            const profitPercentage = ((normalPriceWithSellingDiscount - sellerPriceWithDiscount) / product.price) * 100
            const profitValue = product.price * (profitPercentage / 100)

            return {
                id: product.id,
                name: product.name,
                price: product.price,
                seller_price: product.seller_price,
                discount: product.discount,
                selling_discount: product.selling_discount,
                tax: product.tax,
                size: product.size,
                color: product.color,
                description: product.description,
                bar_code: product.bar_code,
                brand_name: product.brand_name,
                inventory_id: product.inventory_id,
                supplier_id: product.supplier_id,
                admin_id: product.admin_id,
                calculate_length: product.calculate_length,
                created_at: product.created_at,
                updated_at: product.updated_at,
                profit: profitValue.toFixed(2) // Include calculated profit value
            }
        })

        if (response.data.meta) {
            pagination.value = {
                total: response.data.meta.total,
                currentPage: response.data.meta.current_page,
                perPage: response.data.meta.per_page
            }
        }
    } catch (error) {
        console.error('Error fetching products:', error)
        const errorMessage = error.code === 'ECONNABORTED'
            ? 'Network timeout. Please try again.'
            : 'Failed to load products'

        Swal.fire({
            icon: "error",
            title: "Error!",
            text: errorMessage,
            background: '#1e293b',
            color: '#ffffff'
        })
    } finally {
        isLoading.value = false
    }
}

const filteredProducts = computed(() => {
    let result = products.value.filter(product => {
        const matchesSearch = searchQuery.value === '' ||
            product.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
            product.id.toString().toLowerCase().includes(searchQuery.value.toLowerCase())
        const matchesCategory = !categoryFilter.value || product.category === categoryFilter.value
        const matchesSupplier = !supplierFilter.value || product.supplier === supplierFilter.value
        const matchesBrand = !brandFilter.value || product.brand === brandFilter.value
        return matchesSearch && matchesCategory && matchesSupplier && matchesBrand
    })

    result.sort((a, b) => {
        let fieldA = a[sortField.value]
        let fieldB = b[sortField.value]

        if (sortField.value === 'quantity') {
            fieldA = Number(fieldA)
            fieldB = Number(fieldB)
        }

        if (sortField.value === 'discount') {
            fieldA = Number(fieldA.replace('%', ''))
            fieldB = Number(fieldB.replace('%', ''))
        }

        if (fieldA < fieldB) return sortDirection.value === 'asc' ? -1 : 1
        if (fieldA > fieldB) return sortDirection.value === 'asc' ? 1 : -1
        return 0
    })

    return result
})

const activeFiltersCount = computed(() => {
    let count = 0
    if (categoryFilter.value) count++
    if (supplierFilter.value) count++
    if (brandFilter.value) count++
    return count
})

const resetFilters = () => {
    categoryFilter.value = ''
    supplierFilter.value = ''
    brandFilter.value = ''
    searchQuery.value = ''
}

const handleAddSubmit = () => {
    // Mark all required fields as touched
    const requiredFields = ['name', 'description', 'price', 'seller_price']
    requiredFields.forEach(field => markFieldAsTouched(field))

    if (!validateForm(newProduct.value)) {
        Swal.fire({
            icon: 'error',
            title: 'Validation Error',
            text: 'Please fill in all required fields',
            background: '#1e293b',
            color: '#ffffff'
        })
        return
    }
    handleAddProduct()
}

const handleAddProduct = async () => {
    if (!validateForm(newProduct.value)) return
    isAddingProduct.value = true

    try {
        // Fetch quantity from inventory using inventory_id
        const inventoryResponse = await connection.get(`/inventory/${newProduct.value.inventory_id}`)
        const inventoryData = inventoryResponse.data
        if (!inventoryData || !inventoryData.quantity) {
            throw new Error('Invalid inventory ID or no quantity available')
        }

        const payload = {
            name: newProduct.value.name,
            price: parseFloat(newProduct.value.price),
            seller_price: parseFloat(newProduct.value.seller_price),
            discount: newProduct.value.discount ? parseFloat(newProduct.value.discount) : 0,
            selling_discount: parseFloat(newProduct.value.selling_discount) || 0, // Add this line for selling discount
            tax: parseFloat(newProduct.value.tax),
            size: newProduct.value.size,
            color: newProduct.value.color,
            description: newProduct.value.description,
            bar_code: newProduct.value.bar_code,
            brand_name: newProduct.value.brand_name,
            inventory_id: parseInt(newProduct.value.inventory_id),
            supplier_id: parseInt(newProduct.value.supplier_id),
            admin_id: parseInt(newProduct.value.admin_id),
            quantity: inventoryData.quantity, // Use quantity from inventory
            calculate_length: newProduct.value.calculate_length // Include calculate_length
        }

        // Save form data before submission
        localStorage.setItem('draft_product', JSON.stringify(newProduct.value))

        const response = await connection.post('/products', payload)

        if (!response?.data?.status) {
            throw new Error('Invalid response format')
        }

        if (response.data.status === 'success') {
            // Fetch supplier details
            const supplierResponse = await connection.get(`/suppliers/${newProduct.value.supplier_id}`)
            const supplierData = supplierResponse.data

            const productWithSupplier = {
                ...response.data.data,
                supplierDetails: {
                    name: supplierData.name,
                    email: supplierData.email,
                    contact: supplierData.contact
                }
            }

            // Generate GRN number and save GRN
            const generatedGRNNumber = `GRN-${new Date().getFullYear()}-${String(response.data.data.id).padStart(5, '0')}`

            // Save GRN to backend
            const grnPayload = {
                grn_number: generatedGRNNumber,
                product_id: response.data.data.id,
                supplier_id: newProduct.value.supplier_id,
                admin_id: newProduct.value.admin_id,
                price: newProduct.value.price,
                quantity: inventoryData.quantity, // Include quantity in GRN payload
                product_details: {
                    name: newProduct.value.name,
                    description: newProduct.value.description,
                    brand_name: newProduct.value.brand_name,
                    size: newProduct.value.size,
                    color: newProduct.value.color,
                    bar_code: newProduct.value.bar_code
                },
                received_date: new Date().toISOString().split('T')[0]
            }

            await connection.post('/grn-notes', grnPayload)

            products.value.push(productWithSupplier)
            grnNumber.value = generatedGRNNumber
            grnProduct.value = { ...productWithSupplier, quantity: inventoryData.quantity } // Pass quantity to GRN document
            showGRN.value = true
            showModal.value = false

            // Reset form
            newProduct.value = {
                name: '',
                price: '',
                seller_price: '',
                discount: '',
                tax: '',
                size: '',
                color: '',
                description: '',
                bar_code: '',
                brand_name: '',
                inventory_id: '',
                supplier_id: '',
                admin_id: ''
            }

            Swal.fire({
                position: "center",
                icon: "success",
                title: "Product Added Successfully!",
                showConfirmButton: false,
                timer: 1500,
                background: '#1e293b',
                color: '#ffffff'
            }).then(() => {
                location.reload(); // Refresh the page after adding a product
            });
        } else {
            throw new Error(response.data.message || 'Failed to add product')
        }
    } catch (error) {
        if (error.response?.status === 429) {
            Swal.fire({
                icon: 'warning',
                title: 'Rate Limited',
                text: 'Please try again later',
                background: '#1e293b',
                color: '#ffffff'
            })
            return
        }

        let errorMessage = 'Failed to add product'

        if (error.response?.data?.message) {
            // Handle validation errors from Laravel
            if (typeof error.response.data.message === 'object') {
                // If message contains multiple validation errors, join them
                errorMessage = Object.values(error.response.data.message).flat().join('\n')
            } else {
                errorMessage = error.response.data.message
            }
        } else if (error.message) {
            errorMessage = error.message
        }

        console.error('Error adding product:', error)

        Swal.fire({
            icon: "error",
            title: "Error!",
            text: errorMessage,
            background: '#1e293b',
            color: '#ffffff'
        })
    } finally {
        isAddingProduct.value = false
    }
}

const openEditModal = (product) => {
    console.log('Product data:', product); // Debug the product data
    // Ensure all required fields are included and properly initialized
    editingProduct.value = {
        id: product.id,
        name: product.name,
        price: product.price,
        profit: product.profit,
        seller_price: product.seller_price,
        discount: product.discount,
        tax: product.tax,
        size: product.size,
        color: product.color,
        description: product.description,
        bar_code: product.bar_code,
        brand_name: product.brand_name,
        inventory_id: product.inventory_id,
        supplier_id: product.supplier_id,
        admin_id: product.admin_id,
        calculate_length: !!product.calculate_length, // Ensure boolean value
        selling_discount: product.selling_discount ?? 0, // Use nullish coalescing to default to 0 if undefined or null
    };
    showEditModal.value = true;
};

const handleEditProduct = async () => {
    if (!validateForm(editingProduct.value)) return
    isUpdatingProduct.value = true

    try {
        const payload = {
            name: editingProduct.value.name,
            price: parseFloat(editingProduct.value.price),
            profit: parseFloat(editingProduct.value.profit),
            seller_price: parseFloat(editingProduct.value.seller_price),
            discount: parseFloat(editingProduct.value.discount),
            tax: parseFloat(editingProduct.value.tax),
            size: editingProduct.value.size,
            color: editingProduct.value.color,
            description: editingProduct.value.description,
            bar_code: editingProduct.value.bar_code,
            brand_name: editingProduct.value.brand_name,
            inventory_id: parseInt(editingProduct.value.inventory_id),
            supplier_id: parseInt(editingProduct.value.supplier_id),
            admin_id: parseInt(editingProduct.value.admin_id),
            calculate_length: !!editingProduct.value.calculate_length, // Ensure boolean value
            selling_discount: parseFloat(editingProduct.value.selling_discount) || 0, // Include selling_discount
        }

        const response = await connection.put(`/products/${editingProduct.value.id}`, payload)

        if (response.data.status === 'success') {
            // Update the local product list with the updated data
            const index = products.value.findIndex(p => p.id === editingProduct.value.id)
            if (index !== -1) {
                products.value[index] = {
                    ...products.value[index],
                    ...response.data.data
                }
            }

            showEditModal.value = false
            Swal.fire({
                position: "center",
                icon: "success",
                title: "Product Updated Successfully!",
                showConfirmButton: false,
                timer: 1500,
                background: '#1e293b',
                color: '#ffffff'
            })
        } else {
            throw new Error(response.data.message || 'Failed to update product')
        }
    } catch (error) {
        console.error('Error updating product:', error)
        let errorMessage = 'Failed to update product'

        if (error.response?.data?.message) {
            if (typeof error.response.data.message === 'object') {
                errorMessage = Object.values(error.response.data.message).flat().join('\n')
            } else {
                errorMessage = error.response.data.message
            }
        } else if (error.message) {
            errorMessage = error.message
        }

        Swal.fire({
            icon: "error",
            title: "Error!",
            text: errorMessage,
            background: '#1e293b',
            color: '#ffffff'
        })
    } finally {
        isUpdatingProduct.value = false
    }
}

const openDeleteModal = (product) => {
    Swal.fire({
        title: "Are you sure?",
        text: `Do you want to delete product "${product.name}"?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!",
        background: '#1e293b',
        color: '#ffffff'
    }).then((result) => {
        if (result.isConfirmed) {
            handleDeleteProduct(product)
        }
    })
}

const handleDeleteProduct = async (product) => {
    try {
        await connection.delete(`/products/${product.id}`)
        products.value = products.value.filter(p => p.id !== product.id)

        Swal.fire({
            position: "center",
            icon: "success",
            title: "Product Deleted Successfully!",
            showConfirmButton: false,
            timer: 1500,
            background: '#1e293b',
            color: '#ffffff'
        })
    } catch (error) {
        console.error('Error deleting product:', error)
        Swal.fire({
            icon: "error",
            title: "Error!",
            text: "Failed to delete product",
            background: '#1e293b',
            color: '#ffffff'
        })
    }
}

const handleEditSubmit = async () => {
    if (!validateForm(editingProduct.value)) {
        Swal.fire({
            icon: "error",
            title: "Validation Error",
            text: "Please fill in all required fields",
            background: '#1e293b',
            color: '#ffffff'
        })
        return
    }
    await handleEditProduct()
}

const addNewCategory = () => {
    if (newCategory.value && !categories.value.includes(newCategory.value)) {
        categories.value.push(newCategory.value)
        newProduct.value.category = newCategory.value
        newCategory.value = ''

        Swal.fire({
            position: "center",
            icon: "success",
            title: "New Category Added!",
            showConfirmButton: false,
            timer: 1500,
            background: '#1e293b',
            color: '#ffffff'
        })
    }
    showCategoryInput.value = false
}

const addNewSupplier = () => {
    if (newSupplier.value && !suppliers.value.includes(newSupplier.value)) {
        suppliers.value.push(newSupplier.value)
        newProduct.value.supplier = newSupplier.value
        newSupplier.value = ''

        Swal.fire({
            position: "center",
            icon: "success",
            title: "New Supplier Added!",
            showConfirmButton: false,
            timer: 1500,
            background: '#1e293b',
            color: '#ffffff'
        })
    }
    showSupplierInput.value = false
}

const addNewBrand = () => {
    if (newBrand.value && !brands.value.includes(newBrand.value)) {
        brands.value.push(newBrand.value)
        newProduct.value.brand = newBrand.value
        newBrand.value = ''

        Swal.fire({
            position: "center",
            icon: "success",
            title: "New Brand Added!",
            showConfirmButton: false,
            timer: 1500,
            background: '#1e293b',
            color: '#ffffff'
        })
    }
    showBrandInput.value = false
}

const toggleSort = (field) => {
    if (sortField.value === field) {
        sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    } else {
        sortField.value = field
        sortDirection.value = 'asc'
    }
}

const getSortIcon = (field) => {
    if (sortField.value !== field) {
        return ArrowsUpDownIcon
    }
    return sortDirection.value === 'asc' ? ChevronUpIcon : ChevronDownIcon
}

const refreshData = async () => {
    isLoading.value = true
    await fetchProducts()
    Swal.fire({
        position: "center",
        icon: "success",
        title: "Data Refreshed!",
        showConfirmButton: false,
        timer: 1000,
        background: '#1e293b',
        color: '#ffffff'
    })
}

const openViewModal = (product) => {
    viewingProduct.value = product
    showViewModal.value = true
}

const restoreFormData = () => {
    const savedData = localStorage.getItem('draft_product')
    if (savedData) {
        try {
            newProduct.value = JSON.parse(savedData)
        } catch (e) {
            console.error('Error restoring form data:', e)
        }
    }
}

const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (file && file.type.startsWith('image/')) {
        uploadedFile.value = file
        return true
    }
    return false
}

const handleBatchDelete = async () => {
    if (!selectedProducts.value?.length) return

    try {
        await Promise.all(
            selectedProducts.value.map(id => connection.delete(`/products/${id}`))
        )
        selectedProducts.value = []
    } catch (error) {
        console.error('Error in batch delete:', error)
    }
}

const updateCalculateLength = async (productId, calculateLength) => {
    try {
        const payload = { calculate_length: calculateLength };
        const response = await connection.put(`/products/${productId}`, payload);

        if (response.data.status === 'success') {
            const product = products.value.find(p => p.id === productId);
            if (product) {
                product.calculate_length = calculateLength;
            }
            Swal.fire({
                position: "center",
                icon: "success",
                title: `Calculate Length updated to ${calculateLength ? 'Yes' : 'No'}`,
                showConfirmButton: false,
                timer: 1500,
                background: '#1e293b',
                color: '#ffffff'
            });
        }
    } catch (error) {
        console.error('Error updating calculate_length:', error);
        Swal.fire({
            icon: "error",
            title: "Error!",
            text: "Failed to update Calculate Length",
            background: '#1e293b',
            color: '#ffffff'
        });
    }
};

const openGRNDocument = async (product) => {
    try {
        // Log product details
        console.log('Product Details:', product);

        // Fetch and log inventory details
        const inventoryResponse = await connection.get(`/inventory/${product.inventory_id}`);
        console.log('Inventory Details:', inventoryResponse.data);
        
        // Fetch supplier details
        const supplierResponse = await connection.get(`/suppliers/${product.supplier_id}`);
        const supplierData = supplierResponse.data;

        // Log combined details
        console.log('Combined Product & Inventory Details:', {
            product,
            inventory: inventoryResponse.data,
            supplier: supplierData
        });

        // Combine product data with supplier details and inventory quantity
        grnProduct.value = {
            ...product,
            quantity: inventoryResponse.data.quantity, // Add inventory quantity
            supplierDetails: {
                name: supplierData.name,
                email: supplierData.email,
                contact: supplierData.contact
            }
        }
        
        grnNumber.value = `GRN-${new Date().getFullYear()}-${String(product.id).padStart(5, '0')}`
        showGRN.value = true
    } catch (error) {
        console.error('Error fetching details:', error)
        Swal.fire({
            icon: "error", 
            title: "Error!",
            text: "Failed to fetch details",
            background: '#1e293b',
            color: '#ffffff'
        })
    }
}

onMounted(() => {
    fetchProducts()
    restoreFormData() // Restore any saved form data
})

// Add cleanup on unmount
onUnmounted(() => {
    products.value = []
    selectedProducts.value = []
    uploadedFile.value = null
    localStorage.removeItem('draft_product')
})
</script>

<template>
    <div class="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white min-h-screen">
        <Header />
        <Sidebar :isVisible="isSidebarVisible" @closeSidebar="toggleSidebar(false)" />
        <div class="fixed top-0 left-0 w-8 h-full z-50" @mouseenter="toggleSidebar(true)"></div>
        <div class="ml-0 pt-20">
            <div class="w-full h-full flex flex-col p-4 md:p-6">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div class="flex items-center space-x-4">
                        <h1
                            class="text-2xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                            Products Management
                        </h1>
                    </div>
                    <div class="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
                        <div class="relative w-full md:w-80">
                            <input v-model="searchQuery" type="search" placeholder="Search by ID or name..."
                                class="w-full px-4 py-2 bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700 pl-10">
                            <MagnifyingGlassIcon class="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
                        </div>
                        <button @click="showModal = true"
                            class="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700 font-medium inline-flex items-center transition-colors w-full md:w-auto justify-center">
                            <PlusIcon class="w-5 h-5 mr-2" />
                            Add Product
                        </button>
                    </div>
                </div>

                <div
                    class="flex-1 bg-gray-800/50 backdrop-blur-sm rounded-lg overflow-hidden shadow-xl border border-gray-700/50">
                    <div class="h-full overflow-auto">
                        <table class="w-full table-auto">
                            <thead class="sticky top-0">
                                <tr class="bg-gray-700/90 backdrop-blur-sm">
                                    <th @click="toggleSort('id')"
                                        class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600/50 transition-colors">
                                        <div class="flex items-center space-x-1">
                                            <span>ID</span>
                                            <component :is="getSortIcon('id')" class="w-4 h-4" />
                                        </div>
                                    </th>
                                    <th @click="toggleSort('name')"
                                        class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600/50 transition-colors">
                                        <div class="flex items-center space-x-1">
                                            <span>Name</span>
                                            <component :is="getSortIcon('name')" class="w-4 h-4" />
                                        </div>
                                    </th>
                                    <th @click="toggleSort('price')"
                                        class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600/50 transition-colors">
                                        <div class="flex items-center space-x-1">
                                            <span>Price</span>
                                            <component :is="getSortIcon('price')" class="w-4 h-4" />
                                        </div>
                                    </th>
                                    <th @click="toggleSort('seller_price')"
                                        class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600/50 transition-colors">
                                        <div class="flex items-center space-x-1">
                                            <span>Seller Price</span>
                                            <component :is="getSortIcon('seller_price')" class="w-4 h-4" />
                                        </div>
                                    </th>
                                    
                                    <th @click="toggleSort('brand_name')"
                                        class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600/50 transition-colors">
                                        <div class="flex items-center space-x-1">
                                            <span>Brand</span>
                                            <component :is="getSortIcon('brand_name')" class="w-4 h-4" />
                                        </div>
                                    </th>
                                    <th @click="toggleSort('inventory_id')"
                                        class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600/50 transition-colors">
                                        <div class="flex items-center space-x-1">
                                            <span>Inventory ID</span>
                                            <component :is="getSortIcon('inventory_id')" class="w-4 h-4" />
                                        </div>
                                    </th>
                                    <th @click="toggleSort('supplier_id')"
                                        class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600/50 transition-colors">
                                        <div class="flex items-center space-x-1">
                                            <span>Supplier ID</span>
                                            <component :is="getSortIcon('supplier_id')" class="w-4 h-4" />
                                        </div>
                                    </th>
                                    <th
                                        class="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-700/50">
                                <tr v-if="isLoading" class="hover:bg-gray-700">
                                    <td colspan="10" class="h-[400px] relative">
                                        <div
                                            class="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                                            <div class="loader-container">
                                                <div class="loader">
                                                    <svg class="circular" viewBox="25 25 50 50">
                                                        <defs>
                                                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%">
                                                                <stop offset="0%" stop-color="#3b82f6" />
                                                                <stop offset="50%" stop-color="#8b5cf6" />
                                                                <stop offset="100%" stop-color="#ec4899" />
                                                            </linearGradient>
                                                        </defs>
                                                        <circle class="path" cx="50" cy="50" r="20" fill="none"
                                                            stroke="url(#gradient)" stroke-width="3"
                                                            stroke-miterlimit="10" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <div
                                                class="text-base font-medium text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse">
                                                Loading products...
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                                <template v-else>
                                    <tr v-if="filteredProducts.length === 0" class="hover:bg-gray-700">
                                        <td colspan="10" class="px-6 py-8 text-center text-gray-400">
                                            No products available
                                        </td>
                                    </tr>
                                    <tr v-else v-for="product in filteredProducts" :key="product.id"
                                        class="hover:bg-gray-700/30 transition-colors duration-200">
                                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                                            <span class="font-mono bg-gray-700/50 px-2 py-1 rounded text-gray-300">{{
                                                product.id }}</span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm">{{ product.name }}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                                            ${{ Number(product.price).toFixed(2) }}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                                            ${{ Number(product.seller_price).toFixed(2) }}
                                        </td>
                                       
                                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                                            <span
                                                class="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                                                {{ product.brand_name }}
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                                            <span class="font-mono bg-gray-700/50 px-2 py-1 rounded text-gray-300">
                                                {{ product.inventory_id }}
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                                            <span class="font-mono bg-gray-700/50 px-2 py-1 rounded text-gray-300">
                                                {{ product.supplier_id }}
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <div class="flex items-center justify-end space-x-2">
                                                <button @click="openViewModal(product)"
                                                    class="text-cyan-400 hover:text-cyan-300 p-1.5 hover:bg-gray-700 rounded-full transition-colors"
                                                    title="View Details">
                                                    <EyeIcon class="w-5 h-5" />
                                                </button>
                                                <button @click="openEditModal(product)"
                                                    class="text-purple-400 hover:text-purple-300 p-1.5 hover:bg-gray-700 rounded-full transition-colors"
                                                    title="Edit Product">
                                                    <PencilIcon class="w-5 h-5" />
                                                </button>
                                                <button @click="openDeleteModal(product)"
                                                    class="text-rose-500 hover:text-rose-400 p-1.5 hover:bg-gray-700 rounded-full transition-colors"
                                                    title="Delete Product">
                                                    <TrashIcon class="w-5 h-5" />
                                                </button>
                                                <button @click="openGRNDocument(product)"
                                                    class="text-yellow-400 hover:text-yellow-300 p-1.5 hover:bg-gray-700 rounded-full transition-colors"
                                                    title="Download GRN">
                                                    <ArrowDownTrayIcon class="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                </template>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="mt-4 text-sm text-gray-400 flex justify-between items-center">
                    <div>
                        Showing {{ filteredProducts.length }} of {{ products.length }} products
                    </div>
                    <div>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div class="bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg w-full max-w-[95%] p-6 shadow-xl border border-gray-700/50 h-[80vh] overflow-hidden"
                @click.stop>
                <div class="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                    <div class="flex items-center space-x-2">
                        <CubeIcon class="w-6 h-6 text-blue-500" />
                        <h2 class="text-xl font-semibold">Add New Product</h2>
                    </div>
                    <button @click="showModal = false"
                        class="text-gray-400 hover:text-gray-200 hover:bg-gray-700 p-2 rounded-full transition-colors">
                        <XMarkIcon class="w-5 h-5" />
                    </button>
                </div>

                <form @submit.prevent="handleAddSubmit" class="space-y-4 h-full overflow-y-auto px-2">
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <!-- Column 1 -->
                        <div class="space-y-4">
                            <h3 class="text-sm font-medium text-gray-300 uppercase tracking-wider">Basic Information</h3>
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-1">Product Name</label>
                                <input v-model="newProduct.name" @blur="markFieldAsTouched('name')" type="text"
                                    class="w-full px-3 py-1.5 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 border border-gray-600"
                                    :class="{ 'border-red-500': touchedFields.name && formErrors.name }" required>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-1">Brand Name</label>
                                <input v-model="newProduct.brand_name" type="text"
                                    class="w-full px-3 py-1.5 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 border border-gray-600">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-1">Bar Code</label>
                                <input v-model="newProduct.bar_code" type="text"
                                    class="w-full px-3 py-1.5 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 border border-gray-600">
                            </div>
                        </div>

                        <!-- Column 2 -->
                        <div class="space-y-4">
                            <h3 class="text-sm font-medium text-gray-300 uppercase tracking-wider">Pricing Details</h3>
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-1">Price</label>
                                <input v-model="newProduct.price" type="number" step="0.01"
                                    class="w-full px-3 py-1.5 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 border border-gray-600">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-1">Supplier Price</label>
                                <input v-model="newProduct.seller_price" type="number" step="0.01"
                                    class="w-full px-3 py-1.5 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 border border-gray-600">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-1">Tax (%)</label>
                                <input v-model="newProduct.tax" type="number" step="0.01"
                                    class="w-full px-3 py-1.5 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 border border-gray-600">
                            </div>
                        </div>

                        <!-- Column 3 -->
                        <div class="space-y-4">
                            <h3 class="text-sm font-medium text-gray-300 uppercase tracking-wider">Discounts</h3>
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-1">Supplier Discount (%)</label>
                                <input v-model="newProduct.discount" type="number" step="0.01"
                                    class="w-full px-3 py-1.5 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 border border-gray-600">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-1">Selling Discount (%)</label>
                                <input v-model="newProduct.selling_discount" type="number" step="0.01"
                                    class="w-full px-3 py-1.5 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 border border-gray-600">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-1">Calculate Length</label>
                                <input v-model="newProduct.calculate_length" type="checkbox"
                                    class="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                            </div>
                        </div>

                        <!-- Column 4 -->
                        <div class="space-y-4">
                            <h3 class="text-sm font-medium text-gray-300 uppercase tracking-wider">Additional Details</h3>
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-1">Size</label>
                                <input v-model="newProduct.size" type="text"
                                    class="w-full px-3 py-1.5 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 border border-gray-600">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-1">Color</label>
                                <input v-model="newProduct.color" type="text"
                                    class="w-full px-3 py-1.5 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 border border-gray-600">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-1">Admin ID</label>
                                <input v-model="newProduct.admin_id" type="number"
                                    class="w-full px-3 py-1.5 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 border border-gray-600">
                            </div>
                        </div>
                    </div>

                    <!-- Description field spanning all columns -->
                    <div class="space-y-2">
                        <label class="block text-sm font-medium text-gray-300 mb-1">Description</label>
                        <textarea v-model="newProduct.description" @blur="markFieldAsTouched('description')"
                            class="w-full px-3 py-1.5 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 border border-gray-600"
                            :class="{ 'border-red-500': touchedFields.description && formErrors.description }" 
                            required rows="2"></textarea>
                    </div>

                    <div class="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-700">
                        <button type="button" @click="showModal = false"
                            class="px-4 py-2.5 text-gray-300 hover:text-white bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors duration-200 flex items-center">
                            <XMarkIcon class="w-5 h-5 mr-2" />
                            Cancel
                        </button>
                        <button type="submit" :disabled="!validateForm(newProduct) || isAddingProduct" :class="[
                            'px-4 py-2.5 rounded-lg transition-all duration-300 flex items-center space-x-2',
                            validateForm(newProduct) && !isAddingProduct
                                ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-800 hover:shadow-lg hover:shadow-blue-500/30 text-white'
                                : 'bg-gray-600 cursor-not-allowed text-gray-400'
                        ]">
                            <template v-if="isAddingProduct">
                                <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg"
                                    fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                        stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                                    </path>
                                </svg>
                                <span>Adding Product...</span>
                            </template>
                            <template v-else>
                                <CheckIcon class="w-5 h-5 mr-2" />
                                Add Product
                            </template>
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <div v-if="showEditModal" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div class="bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg w-full max-w-7xl p-8 shadow-xl border border-gray-700/50 max-h-[99vh] min-h-[85vh] overflow-auto" @click.stop>
                <div class="flex justify-between items-center mb-6 border-b border-gray-700/50 pb-4">
                    <div class="flex items-center space-x-2">
                        <PencilIcon class="w-6 h-6 text-purple-400" />
                        <h2 class="text-xl font-semibold text-purple-400">Edit Product</h2>
                    </div>
                    <button @click="showEditModal = false"
                        class="text-gray-400 hover:text-gray-200 hover:bg-gray-700 p-2 rounded-full transition-colors">
                        <XMarkIcon class="w-5 h-5" />
                    </button>
                </div>

                <form @submit.prevent="handleEditSubmit" class="space-y-8">
                    <!-- Top Row with increased height -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <!-- Basic Information -->
                        <div class="space-y-4">
                            <h3 class="text-sm font-medium text-gray-300 uppercase mb-3">Basic Information</h3>
                            <div class="bg-gray-800/50 backdrop-blur-sm p-5 rounded-lg border border-gray-700/30 space-y-4">
                                <div>
                                    <span class="text-sm font-medium text-purple-400">Product ID</span>
                                    <input v-model="editingProduct.id" type="text"
                                        class="w-full px-4 py-1.5 bg-gray-700/50 rounded-lg border border-gray-600 mt-1 opacity-70"
                                        disabled>
                                </div>
                                <div>
                                    <span class="text-sm font-medium text-purple-400">Name</span>
                                    <input v-model="editingProduct.name" type="text"
                                        class="w-full px-4 py-1.5 bg-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-600 mt-1"
                                        required>
                                </div>
                                <div>
                                    <span class="text-sm font-medium text-purple-400">Description</span>
                                    <textarea v-model="editingProduct.description"
                                        class="w-full px-4 py-1.5 bg-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-600 mt-1"
                                        required rows="2"></textarea>
                                </div>
                            </div>
                        </div>

                        <!-- Pricing Information -->
                        <div class="space-y-4">
                            <h3 class="text-sm font-medium text-gray-300 uppercase mb-3">Pricing Details</h3>
                            <div class="bg-gray-800/50 backdrop-blur-sm p-5 rounded-lg border border-gray-700/30 space-y-4">
                                <div>
                                    <span class="text-sm font-medium text-purple-400">Price</span>
                                    <input v-model="editingProduct.price" type="number" step="0.01"
                                        class="w-full px-4 py-1.5 bg-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-600 mt-1"
                                        required>
                                </div>
                                <div>
                                    <span class="text-sm font-medium text-purple-400">Supplier Price</span>
                                    <input v-model="editingProduct.seller_price" type="number" step="0.01"
                                        class="w-full px-4 py-1.5 bg-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-600 mt-1">
                                </div>
                                <div>
                                    <span class="text-sm font-medium text-purple-400">Profit</span>
                                    <input v-model="editingProduct.profit" type="number" step="0.01"
                                        class="w-full px-4 py-1.5 bg-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-600 mt-1"
                                        required>
                                </div>
                            </div>
                        </div>

                        <!-- Product Specifications -->
                        <div class="space-y-4">
                            <h3 class="text-sm font-medium text-gray-300 uppercase mb-3">Product Specifications</h3>
                            <div class="bg-gray-800/50 backdrop-blur-sm p-5 rounded-lg border border-gray-700/30 space-y-4">
                                <div>
                                    <span class="text-sm font-medium text-purple-400">Size & Color</span>
                                    <div class="grid grid-cols-2 gap-2 mt-1">
                                        <input v-model="editingProduct.size" type="text" placeholder="Size"
                                            class="px-4 py-1.5 bg-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-600">
                                        <input v-model="editingProduct.color" type="text" placeholder="Color"
                                            class="px-4 py-1.5 bg-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-600">
                                    </div>
                                </div>
                                <div>
                                    <span class="text-sm font-medium text-purple-400">Brand Name</span>
                                    <input v-model="editingProduct.brand_name" type="text"
                                        class="w-full px-4 py-1.5 bg-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-600 mt-1">
                                </div>
                                <div>
                                    <span class="text-sm font-medium text-purple-400">Bar Code</span>
                                    <input v-model="editingProduct.bar_code" type="text"
                                        class="w-full px-4 py-1.5 bg-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-600 mt-1">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Bottom Row with increased padding -->
                    <div class="space-y-4">
                        <h3 class="text-sm font-medium text-gray-300 uppercase mb-3">Additional Information</h3>
                        <div class="bg-gray-800/50 backdrop-blur-sm p-8 rounded-lg border border-gray-700/30">
                            <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                <div>
                                    <span class="text-sm font-medium text-purple-400">Inventory ID</span>
                                    <input v-model="editingProduct.inventory_id" type="number"
                                        class="w-full px-4 py-1.5 bg-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-600 mt-1">
                                </div>
                                <div>
                                    <span class="text-sm font-medium text-purple-400">Supplier ID</span>
                                    <input v-model="editingProduct.supplier_id" type="number"
                                        class="w-full px-4 py-1.5 bg-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-600 mt-1">
                                </div>
                                <div>
                                    <span class="text-sm font-medium text-purple-400">Admin ID</span>
                                    <input v-model="editingProduct.admin_id" type="number"
                                        class="w-full px-4 py-1.5 bg-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-600 mt-1">
                                </div>
                                <div>
                                    <span class="text-sm font-medium text-purple-400">Calculate Length</span>
                                    <div class="flex items-center mt-3">
                                        <input v-model="editingProduct.calculate_length" type="checkbox"
                                            class="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500">
                                    </div>
                                </div>
                                <div>
                                    <span class="text-sm font-medium text-purple-400">Supplier Discount (%)</span>
                                    <input v-model="editingProduct.discount" type="number" step="0.01"
                                        class="w-full px-4 py-1.5 bg-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-600 mt-1">
                                </div>
                                <div>
                                    <span class="text-sm font-medium text-purple-400">Selling Discount (%)</span>
                                    <input v-model="editingProduct.selling_discount" type="number" step="0.01"
                                        class="w-full px-4 py-1.5 bg-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-600 mt-1">
                                </div>
                                <div>
                                    <span class="text-sm font-medium text-purple-400">Tax (%)</span>
                                    <input v-model="editingProduct.tax" type="number" step="0.01"
                                        class="w-full px-4 py-1.5 bg-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-600 mt-1">
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-700">
                        <button type="button" @click="showEditModal = false"
                            class="px-4 py-2.5 text-gray-300 hover:text-white bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors duration-200 flex items-center">
                            <XMarkIcon class="w-5 h-5 mr-2" />
                            Cancel
                        </button>
                        <button type="submit" :disabled="!validateForm(editingProduct) || isUpdatingProduct" :class="[
                            'px-4 py-2.5 rounded-lg transition-all duration-300 flex items-center space-x-2',
                            validateForm(editingProduct) && !isUpdatingProduct
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 hover:shadow-lg hover:shadow-purple-500/30 text-white'
                                : 'bg-gray-600 cursor-not-allowed text-gray-400'
                        ]">
                            <template v-if="isUpdatingProduct">
                                <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg"
                                    fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                        stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                                    </path>
                                </svg>
                                <span>Updating Product...</span>
                            </template>
                            <template v-else>
                                <CheckIcon class="w-5 h-5 mr-2" />
                                Save Changes
                            </template>
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <div v-if="showViewModal" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div class="bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg w-full max-w-7xl p-8 shadow-xl border border-gray-700/50 max-h-[99vh] min-h-[85vh] overflow-auto" @click.stop>
                <div class="flex justify-between items-center mb-6 border-b border-gray-700/50 pb-4">
                    <div class="flex items-center space-x-2">
                        <EyeIcon class="w-6 h-6 text-cyan-400" />
                        <h2 class="text-xl font-semibold text-cyan-400">Product Details</h2>
                    </div>
                    <button @click="showViewModal = false"
                        class="text-gray-400 hover:text-gray-200 hover:bg-gray-700 p-2 rounded-full transition-colors">
                        <XMarkIcon class="w-5 h-5" />
                    </button>
                </div>

                <div class="space-y-8" v-if="viewingProduct">
                    <!-- Top Row with increased height -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <!-- Basic Information -->
                        <div class="space-y-4">
                            <h3 class="text-sm font-medium text-gray-300 uppercase mb-3">Basic Information</h3>
                            <div class="bg-gray-800/50 backdrop-blur-sm p-5 rounded-lg border border-gray-700/30 space-y-4 h-[calc(100%-2.5rem)]">
                                <div>
                                    <span class="text-sm font-medium text-cyan-400">Product ID</span>
                                    <p class="text-white font-mono bg-gray-700/50 px-2 py-1 rounded mt-1">{{ viewingProduct.id }}</p>
                                </div>
                                <div>
                                    <span class="text-sm font-medium text-cyan-400">Name</span>
                                    <p class="text-white mt-1">{{ viewingProduct.name }}</p>
                                </div>
                                <div>
                                    <span class="text-sm font-medium text-cyan-400">Description</span>
                                    <p class="text-white mt-1">{{ viewingProduct.description }}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Pricing Information -->
                        <div class="space-y-4">
                            <h3 class="text-sm font-medium text-gray-300 uppercase mb-3">Pricing Details</h3>
                            <div class="bg-gray-800/50 backdrop-blur-sm p-5 rounded-lg border border-gray-700/30 space-y-4 h-[calc(100%-2.5rem)]">
                                <div>
                                    <span class="text-sm font-medium text-cyan-400">Price</span>
                                    <p class="text-white mt-1">${{ Number(viewingProduct.price).toFixed(2) }}</p>
                                </div>
                                <div>
                                    <span class="text-sm font-medium text-cyan-400">Supplier Price</span>
                                    <p class="text-white mt-1">${{ Number(viewingProduct.seller_price).toFixed(2) }}</p>
                                </div>
                                <div>
                                    <span class="text-sm font-medium text-cyan-400">Profit</span>
                                    <p class="text-white mt-1">${{ Number(viewingProduct.profit).toFixed(2) }}</p>
                                </div>
                                <div>
                                    <span class="text-sm font-medium text-cyan-400">Discounts & Tax</span>
                                    <div class="grid grid-cols-2 gap-2 mt-1">
                                        <p class="text-white">Supplier: {{ Number(viewingProduct.discount).toFixed(2) }}%</p>
                                        <p class="text-white">Tax: {{ Number(viewingProduct.tax).toFixed(2) }}%</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Product Specifications -->
                        <div class="space-y-4">
                            <h3 class="text-sm font-medium text-gray-300 uppercase mb-3">Product Specifications</h3>
                            <div class="bg-gray-800/50 backdrop-blur-sm p-5 rounded-lg border border-gray-700/30 space-y-4 h-[calc(100%-2.5rem)]">
                                <div>
                                    <span class="text-sm font-medium text-cyan-400">Size & Color</span>
                                    <div class="grid grid-cols-2 gap-2 mt-1">
                                        <p class="text-white">Size: {{ viewingProduct.size }}</p>
                                        <p class="text-white">Color: {{ viewingProduct.color }}</p>
                                    </div>
                                </div>
                                <div>
                                    <span class="text-sm font-medium text-cyan-400">Brand</span>
                                    <p class="text-white mt-1">
                                        <span class="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                                            {{ viewingProduct.brand_name }}
                                        </span>
                                    </p>
                                </div>
                                <div>
                                    <span class="text-sm font-medium text-cyan-400">Bar Code</span>
                                    <p class="text-white font-mono bg-gray-700/50 px-2 py-1 rounded mt-1">{{ viewingProduct.bar_code }}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Bottom Row with increased padding -->
                    <div class="space-y-4 mt-4">
                        <h3 class="text-sm font-medium text-gray-300 uppercase mb-3">System Information</h3>
                        <div class="bg-gray-800/50 backdrop-blur-sm p-8 rounded-lg border border-gray-700/30">
                            <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                <div>
                                    <span class="text-sm font-medium text-cyan-400">Inventory ID</span>
                                    <p class="text-white font-mono bg-gray-700/50 px-2 py-1 rounded mt-1">{{ viewingProduct.inventory_id }}</p>
                                </div>
                                <div>
                                    <span class="text-sm font-medium text-cyan-400">Supplier ID</span>
                                    <p class="text-white font-mono bg-gray-700/50 px-2 py-1 rounded mt-1">{{ viewingProduct.supplier_id }}</p>
                                </div>
                                <div>
                                    <span class="text-sm font-medium text-cyan-400">Admin ID</span>
                                    <p class="text-white font-mono bg-gray-700/50 px-2 py-1 rounded mt-1">{{ viewingProduct.admin_id }}</p>
                                </div>
                                <div>
                                    <span class="text-sm font-medium text-cyan-400">Calculate Length</span>
                                    <p class="text-white mt-1">{{ viewingProduct.calculate_length ? 'Yes' : 'No' }}</p>
                                </div>
                                <div>
                                    <span class="text-sm font-medium text-cyan-400">Created At</span>
                                    <p class="text-white mt-1">{{ new Date(viewingProduct.created_at).toLocaleString() }}</p>
                                </div>
                                <div>
                                    <span class="text-sm font-medium text-cyan-400">Updated At</span>
                                    <p class="text-white mt-1">{{ new Date(viewingProduct.updated_at).toLocaleString() }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex justify-end mt-6 pt-4 border-t border-gray-700">
                    <button @click="showViewModal = false"
                        class="px-4 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center">
                        <XMarkIcon class="w-5 h-5 mr-2" />
                        Close
                    </button>
                </div>
            </div>
        </div>
        <GRNDocument v-if="showGRN" :productData="grnProduct" :grnNumber="grnNumber" :showModal="showGRN"
            @close="showGRN = false" />
    </div>
</template>

<style scoped>
.overflow-auto {
    height: calc(100vh - 200px);
}

table {
    border-collapse: collapse;
    width: 100%;
}

thead {
    position: sticky;
    top: 0;
    z-index: 1;
}

tbody tr:last-child td {
    border-bottom: none;
}

.bg-gray-750 {
    background-color: rgba(55, 65, 81, 0.5);
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

@keyframes slideIn {
    from {
        transform: translateY(-20px);
        opacity: 0;
    }

    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
}

.animate-slideIn {
    animation: slideIn 0.3s ease-out;
}

::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

::-webkit-scrollbar-track {
    background: rgba(31, 41, 55, 0.5);
    border-radius: 4px;
}

::-webkit-scrollbar-thumb {
    background: rgba(75, 85, 99, 0.5);
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: rgba(107, 114, 128, 0.5);
}

.loader-container {
    position: relative;
    width: 100px;
    height: 100px;
}

.loader {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 70px;
    height: 70px;
}

.circular {
    animation: rotate 2s linear infinite;
    height: 100%;
    width: 100%;
    transform-origin: center center;
}

.path {
    stroke-dasharray: 89, 200;
    stroke-dashoffset: 0;
    stroke-linecap: round;
    animation: dash 1.5s ease-in-out infinite;
}

@keyframes rotate {
    100% {
        transform: rotate(360deg);
    }
}

@keyframes dash {
    0% {
        stroke-dasharray: 1, 200;
        stroke-dashoffset: 0;
    }

    50% {
        stroke-dasharray: 89, 200;
        stroke-dashoffset: -35;
    }

    100% {
        stroke-dasharray: 89, 200;
        stroke-dashoffset: -124;
    }
}
</style>
