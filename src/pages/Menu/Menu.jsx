import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import ProductCard from '../../components/Card/ProductCard';
import backgroundImage from '../../assets/img/5.jpg'; // Path to your background image
import { Autocomplete, TextField } from '@mui/material'; // Import Autocomplete and TextField
import "./Menu.css";
import { useNavigate } from 'react-router-dom';
import LoadingAnimation from "../../components/Animation/LoadingAnimation.jsx";
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthProvider'; // Import useAuth
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

const Menu = () => {
    const { isLoggedIn } = useAuth(); // Get login status from useAuth
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [currentCategoryPage, setCurrentCategoryPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit] = useState(8);
    const [categoryLimit] = useState(10);
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [favoritedProIds, setFavoritedProIds] = useState([]); // State for favorited product IDs
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

    const getUserIdFromToken = (token) => {
        try {
            const payload = token.split('.')[1];
            const decodedPayload = JSON.parse(atob(payload));
            return decodedPayload.UserId;
        } catch (error) {
            console.error("Cannot decode token:", error);
            return null;
        }
    };

    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);

        if (parts.length === 2) return parts.pop().split(';').shift();
    };

    const userId = isLoggedIn ? getUserIdFromToken(getCookie('access_token')) : null; // Get userId from token if logged in

    // Fetch favorited product IDs
    useEffect(() => {
        const fetchFavorites = async () => {
            if (!userId) {
                console.warn('No userId found. Skipping fetch.');
                return; // Return if userId is null
            }

            try {
                console.log(`Fetching favorites for userId: ${userId}`);
                const response = await fetch(`http://localhost:1010/api/favorites/${userId}`);

                if (!response.ok) {
                    throw new Error(`Failed to fetch favorites: ${response.statusText}`);
                }

                const data = await response.json();
                const favoriteIds = data.favorites.map(favorite => favorite.proId);
                setFavoritedProIds(favoriteIds);
                console.log('Fetched favorites:', favoriteIds);
            } catch (error) {
                console.error('Error fetching favorites:', error);
            }
        };

        if (isLoggedIn) {
            fetchFavorites();
        }
    }, [userId, isLoggedIn]);

    // Fetch products and their prices and sizes from API
    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const url = searchTerm
                    ? `http://localhost:1010/api/product/search?keyword=${encodeURIComponent(searchTerm)}&page=${currentPage}&limit=${limit}`
                    : selectedCategoryId
                        ? `http://localhost:1010/api/cate/view/${selectedCategoryId}/product?page=${currentPage}&limit=${limit}`
                        : `http://localhost:1010/api/product/list-product?page=${currentPage}&limit=${limit}`;

                const response = await fetch(url);
                const data = await response.json();
                const productList = searchTerm ? data.productResponseList : (selectedCategoryId ? data.responseList : data.productResponses);

                const productsWithDetails = await Promise.all(productList.map(async (product) => {
                    try {
                        const variantResponse = await fetch(`http://localhost:1010/api/product/variants/${product.proId}`);
                        const variantData = await variantResponse.json();
                        const variant = variantData.responseList[0];
                        const price = variant?.price || 'N/A';
                        const size = variant?.size || 'N/A';
                        const stock = variant?.stock || 0;

                        return { ...product, price, size, stock };
                    } catch (variantError) {
                        console.error(`Error fetching variant for product ${product.proId}:`, variantError);
                        return { ...product, price: 'N/A', size: 'N/A', stock: 0 };
                    }
                }));

                setProducts(productsWithDetails);
                setTotalPages(data.totalPage);
            } catch (error) {
                console.error('Error fetching products:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [currentPage, selectedCategoryId, searchTerm]);

    // Fetch categories from API
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch('http://localhost:1010/api/cate/list-category?page=1&limit=100'); // Fetch all categories
                const data = await response.json();
                setCategories(data.categoryResponseList); // Set the categories from the API response
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };

        fetchCategories();
    }, []); // Fetch categories only once when the component mounts

    // Handle product page change
    const handleProductPageChange = (page) => {
        setCurrentPage(page);
    };

    // Handle category page change
    const handleCategoryPageChange = (page) => {
        setCurrentCategoryPage(page);
    };

    // Handle category selection
    const handleCategorySelect = (categoryId) => {
        setSelectedCategoryId(categoryId); // Set the selected category
        setCurrentPage(1); // Reset to the first page when a category is selected
    };

    // Handle search input change from Autocomplete
    const handleSearchChange = (event, value) => {
        setSearchTerm(value);
    };


    // Calculate the categories to display for the current category page
    const displayedCategories = categories.slice((currentCategoryPage - 1) * categoryLimit, currentCategoryPage * categoryLimit);

    // Debounce the search term for better performance
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    // Filtered products based on the search term
    const filteredProducts = debouncedSearchTerm
        ? products.filter(product => product.proName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
        : products;

    // Check if there are any products available for the selected category
    const hasProducts = filteredProducts.length > 0;

    // Handle adding the product to the cart with size and stock
    const handleAddToCart = (product) => {
        const token = getCookie('access_token')
        const userId = getUserIdFromToken(token); // Hàm lấy userId từ token
        const quantity = 1; // Đặt số lượng mặc định là 1
        const { proId, proName, price, size, stock } = product;

        
        // Kiểm tra xem userId có tồn tại hay không
        if (!userId) {
            setShowLoginPrompt(true); // Hiện thông báo yêu cầu đăng nhập
            return;
        } else {
            // Nếu số lượng vượt quá hàng tồn kho, ngăn việc thêm vào giỏ hàng
            if (quantity > stock) {
                alert(`Số lượng vượt quá hàng tồn kho. Chỉ có sẵn ${stock}.`);
                return;
            }

            // Thêm sản phẩm vào giỏ hàng
            addToCart({
                productId: proId,
                name: proName,
                price: price,
                size: size,
                quantity: quantity,
                image: product.productImageResponseList.length > 0
                    ? product.productImageResponseList[0].linkImage
                    : backgroundImage,
            });

        }


    };


    const handleProductCardClick = (product) => {
        navigate(`/product/${product.proId}`, { state: { product } });
    };

    const [isFirstLoad, setIsFirstLoad] = useState(true);
    useEffect(() => {
        // Set `isFirstLoad` to false after the first render
        setIsFirstLoad(false);
    }, []);

    return (
        <>
            <Navbar currentPage={"Thực đơn"} />
            <div
                style={{
                    position: 'relative', // Position relative for the container
                    minHeight: '100vh',
                    display: 'flex'
                }}
            >
                {/* Background with overlay */}
                <div
                    style={{
                        background: `url(${backgroundImage}) no-repeat center center fixed`,
                        backgroundSize: 'cover',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0.25, // Background opacity
                        zIndex: -1,
                    }}
                ></div>

                {/* Menu content */}
                <div className={`container-menu ${isFirstLoad ? 'slide-left' : ''}`}>
                    <div className="overlay-menu">
                        <div className='menu-category'>

                            {/* MUI Autocomplete for product names */}
                            <Autocomplete
                                freeSolo
                                options={products.map((product) => product.proName)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="🔍 Bạn muốn uống gì?"
                                        variant="outlined"
                                        margin="normal"
                                        sx={{
                                            alignItems: 'center',
                                            width: '80%',
                                            marginLeft: '10px',
                                            borderRadius: '10px',
                                            backgroundColor: '#E15959', // Set background color to red
                                            marginBottom: '20px', // Spacing below the input
                                            '& .MuiOutlinedInput-root': {
                                                padding: 0, // Remove padding from the root
                                                '& fieldset': {
                                                    border: 'none', // Remove default fieldset border
                                                },
                                                '&:hover fieldset': {
                                                    border: 'none', // No border on hover
                                                },
                                                '&.Mui-focused fieldset': {
                                                    border: 'none', // No border when focused
                                                },
                                                '& input': {
                                                    color: 'white', // Change text color to white
                                                    padding: '10px 0', // Add vertical padding for better alignment
                                                    height: '1.5em', // Adjust height as needed to fit the design
                                                },
                                            },
                                            '& .MuiInputLabel-root': {
                                                color: 'white', // Change label color to white
                                                paddingBottom: '10px', // Remove padding from the label
                                                lineHeight: '0.8', // Center the text vertically
                                                opacity: 1, // Fully opaque by default
                                                transition: 'opacity 0.2s ease', // Add a smooth transition
                                            },
                                            '& .MuiInputLabel-root.Mui-focused': {
                                                opacity: 0, // Make label disappear when focused
                                                color: 'white', // Change label color when focused
                                            },
                                        }}
                                    />
                                )}
                                onChange={(event, newValue) => {
                                    setSearchTerm(newValue);
                                }}
                            />

                            <h2 className='menu-product-h2'>DANH MỤC SẢN PHẨM</h2>
                            <div className="menu-category-pagination">
                                {/* Pagination Dots */}
                                {Array.from({ length: Math.ceil(categories.length / categoryLimit) }, (_, index) => (
                                    <span
                                        key={index + 1}
                                        className={`pagination-cate-dot ${currentCategoryPage === index + 1 ? 'active' : ''}`}
                                        onClick={() => handleCategoryPageChange(index + 1)}
                                    >
                                        •
                                    </span>
                                ))}
                            </div>
                            <ul className="menu-product-category" style={{ listStyle: 'none', paddingLeft: '0px' }}>
                                {currentCategoryPage === 1 && (
                                    <li
                                        onClick={() => handleCategorySelect(null)}
                                        className={!selectedCategoryId ? 'active-category' : ''}
                                    >
                                        ❤️ Tất cả
                                    </li>
                                )}
                                {displayedCategories.map((category) => (
                                    <li
                                        key={category.cateId}
                                        onClick={() => handleCategorySelect(category.cateId)}
                                        className={selectedCategoryId === category.cateId ? 'active-category' : ''}
                                    >
                                        ❤️ {category.cateName}
                                    </li>
                                ))}
                            </ul>

                        </div>
                    </div>
                </div>

                {/* Product listing */}
                <div className="product-listing">
                    <div className="filter">
                        <button>Lọc sản phẩm</button>
                        {hasProducts && (
                            <div className="menu-product-pagination">
                                {/* Previous Button */}

                                <span
                                    className={`pagination-arrow ${currentPage === 1 ? 'disabled' : ''}`}
                                    onClick={() => currentPage > 1 && handleProductPageChange(currentPage - 1)}
                                >
                                    {'<'}
                                </span>

                                {/* Pagination Dots */}
                                {Array.from({ length: totalPages }, (_, index) => (
                                    <span
                                        key={index + 1}
                                        className={`pagination-dot ${currentPage === index + 1 ? 'active' : ''}`}
                                        onClick={() => handleProductPageChange(index + 1)}
                                    >
                                        •
                                    </span>
                                ))}

                                {/* Next Button */}
                                <span
                                    className={`pagination-arrow ${currentPage === totalPages ? 'disabled' : ''}`}
                                    onClick={() => currentPage < totalPages && handleProductPageChange(currentPage + 1)}
                                >
                                    {'>'}
                                </span>
                            </div>
                        )}

                    </div>

                    {loading ? (
                        <LoadingAnimation />
                    ) : (
                        <div className="products zoomIn ">
                            {hasProducts ? (
                                filteredProducts.map((product) => (
                                    <ProductCard
                                        key={product.proId}
                                        className={"zoom-in"}
                                        product={{
                                            proId: product.proId,
                                            name: product.proName,
                                            size: product.size,
                                            price: `${product.price}`,
                                            image: product.productImageResponseList?.[0]?.linkImage || backgroundImage,
                                        }}
                                        isFavorited={favoritedProIds.includes(product.proId)} // Check if product is favorited
                                        onClick={() => handleProductCardClick(product)}
                                        onAddToCart={() => handleAddToCart(product)} // Use handleAddToCart for correct cart addition
                                    />
                                ))
                            ) : (
                                <p>No products found matching your search.</p>
                            )}
                        </div>
                    )}

                    {showLoginPrompt && (
                        <div className="login-modal">
                            <div className="login-modal-content">
                                <p>Bạn cần đăng nhập để có thể mua hàng.</p>
                                <a href="/login">Đăng nhập</a>
                                <button onClick={() => setShowLoginPrompt(false)}>Đóng</button>
                            </div>
                        </div>
                    )}



                </div>
            </div>
            <Footer />
        </>
    );
};

export default Menu;
