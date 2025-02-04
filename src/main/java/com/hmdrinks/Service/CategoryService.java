package com.hmdrinks.Service;

import com.cloudinary.api.exceptions.BadRequest;
import com.hmdrinks.Entity.*;
import jakarta.transaction.Transactional;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import com.hmdrinks.Exception.BadRequestException;
import com.hmdrinks.Repository.*;
import com.hmdrinks.Request.CRUDCategoryRequest;
import com.hmdrinks.Request.CreateCategoryRequest;
import com.hmdrinks.Response.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.interceptor.TransactionAspectSupport;

import java.sql.Date;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;

@Service
public class CategoryService {
    @Autowired
    private CategoryRepository categoryRepository;
    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private ProductVariantsRepository productVariantsRepository;
    @Autowired
    private ReviewRepository reviewRepository;
    @Autowired
    private CartItemRepository cartItemRepository;
    @Autowired
    private FavouriteItemRepository favouriteItemRepository;
    @Autowired
    private CartRepository cartRepository;

    public ResponseEntity<?> crateCategory(CreateCategoryRequest req) {
        Category category = categoryRepository.findByCateName(req.getCateName());
        if (category != null) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("cateName exists");
        }
        LocalDateTime now = LocalDateTime.now();
        Category cate = new Category();
        cate.setCateName(req.getCateName());
        cate.setCateImg(req.getCateImg());
        cate.setIsDeleted(false);
        cate.setDateCreated(LocalDateTime.now());

        categoryRepository.save(cate);
        return ResponseEntity.status(HttpStatus.OK).body(new CRUDCategoryResponse(
                cate.getCateId(),
                cate.getCateName(),
                cate.getCateImg(),
                cate.getIsDeleted(),
                cate.getDateCreated(),
                cate.getDateUpdated(),
                cate.getDateDeleted()
        ));
    }

    public ResponseEntity<?> getOneCategory(Integer id) {
        Category category = categoryRepository.findByCateId(id);
        if (category == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("category not found");
        }
        return ResponseEntity.status(HttpStatus.OK).body(new CRUDCategoryResponse(
                category.getCateId(),
                category.getCateName(),
                category.getCateImg(),
                category.getIsDeleted(),
                category.getDateCreated(),
                category.getDateUpdated(),
                category.getDateDeleted()
        ));
    }

    public ResponseEntity<?> updateCategory(CRUDCategoryRequest req) {
        Category category = categoryRepository.findByCateIdAndIsDeletedFalse(req.getCateId());
        if (category == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("category not found");
        }
        Category category1 = categoryRepository.findByCateNameAndCateIdNot(req.getCateName(), req.getCateId());
        if (category1 != null) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("category already exists");
        }
        LocalDateTime currentDateTime = LocalDateTime.now();
        category.setCateName(req.getCateName());
        category.setCateImg(category.getCateImg());
        category.setDateUpdated(LocalDateTime.now());
        categoryRepository.save(category);
        return ResponseEntity.status(HttpStatus.OK).body(new CRUDCategoryResponse(
                req.getCateId(),
                req.getCateName(),
                req.getCateImg(),
                category.getIsDeleted(),
                category.getDateCreated(),
                category.getDateUpdated(),
                category.getDateDeleted()
        ));
    }

    public ListCategoryResponse listCategory(String pageFromParam, String limitFromParam) {
        int page = Integer.parseInt(pageFromParam);
        int limit = Integer.parseInt(limitFromParam);
        if (limit >= 100) limit = 100;
        Pageable pageable = PageRequest.of(page - 1, limit);
        Page<Category> categoryList = categoryRepository.findAllByIsDeletedFalse(pageable);
        List<Category> categoryList1 = categoryRepository.findAllByIsDeletedFalse();
        List<CRUDCategoryResponse> crudCategoryResponseList = new ArrayList<>();
        int total = 0;
        for (Category category : categoryList) {
            crudCategoryResponseList.add(new CRUDCategoryResponse(
                    category.getCateId(),
                    category.getCateName(),
                    category.getCateImg(),
                    category.getIsDeleted(),
                    category.getDateCreated(),
                    category.getDateUpdated(),
                    category.getDateDeleted()
            ));
            total++;
        }
        return new ListCategoryResponse(page, categoryList.getTotalPages(), limit, categoryList1.size(), crudCategoryResponseList);
    }

    @Transactional
    public ResponseEntity<?> getAllProductFromCategory(int id, String pageFromParam, String limitFromParam) {
        int page = Integer.parseInt(pageFromParam);
        int limit = Integer.parseInt(limitFromParam);
        if (limit >= 100) limit = 100;
        Pageable pageable = PageRequest.of(page - 1, limit);
        Category category = categoryRepository.findByCateIdAndIsDeletedFalse(id);
        if (category == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("category not found");
        }
        Page<Product> productList = productRepository.findByCategory_CateIdAndIsDeletedFalse(id, pageable);
        List<Product> productList1 = productRepository.findByCategory_CateIdAndIsDeletedFalse(id);
        List<CRUDProductResponse> crudProductResponseList = new ArrayList<>();
        int total = 0;
        for (Product product1 : productList) {
            List<ProductImageResponse> productImageResponses = new ArrayList<>();
            String currentProImg = product1.getListProImg();
            if (currentProImg != null && !currentProImg.trim().isEmpty()) {
                String[] imageEntries1 = currentProImg.split(", ");
                for (String imageEntry : imageEntries1) {
                    String[] parts = imageEntry.split(": ");  // Phân tách stt và url
                    int stt = Integer.parseInt(parts[0]);      // Lấy số thứ tự hiện tại
                    String url = parts[1];                     // Lấy URL
                    productImageResponses.add(new ProductImageResponse(stt, url));
                }
            }
            List<CRUDProductVarResponse> variantResponses = Optional.ofNullable(product1.getProductVariants())
                    .orElse(Collections.emptyList()) // Trả về danh sách rỗng nếu là null
                    .stream()
                    .map(variant -> new CRUDProductVarResponse(
                            variant.getVarId(),
                            variant.getProduct().getProId(),
                            variant.getSize(),
                            variant.getPrice(),
                            variant.getStock(),
                            variant.getIsDeleted(),
                            variant.getDateDeleted(),
                            variant.getDateCreated(),
                            variant.getDateUpdated()
                    ))
                    .toList();

            crudProductResponseList.add(new CRUDProductResponse(
                    product1.getProId(),
                    product1.getCategory().getCateId(),
                    product1.getProName(),
                    productImageResponses,
                    product1.getDescription(),
                    product1.getIsDeleted(),
                    product1.getDateDeleted(),
                    product1.getDateCreated(),
                    product1.getDateUpdated(),
                    variantResponses
            ));
            total++;
        }

        return ResponseEntity.status(HttpStatus.OK).body(new GetViewProductCategoryResponse(
                page,
                productList.getTotalPages(),
                limit,
                productList1.size(),
                crudProductResponseList
        ));

    }

    public TotalSearchCategoryResponse totalSearchCategory(String keyword, int page, int limit) {
        if (limit > 100) limit = 100;
        Pageable pageable = PageRequest.of(page - 1, limit);
        Page<Category> categoryList = categoryRepository.findByCateNameContaining(keyword, pageable);
        List<Category> categoryList1 = categoryRepository.findByCateNameContaining(keyword);
        List<CRUDCategoryResponse> crudCategoryResponseList = new ArrayList<>();
        for (Category category : categoryList) {
            crudCategoryResponseList.add(new CRUDCategoryResponse(
                    category.getCateId(),
                    category.getCateName(),
                    category.getCateImg(),
                    category.getIsDeleted(),
                    category.getDateCreated(),
                    category.getDateUpdated(),
                    category.getDateDeleted()
            ));
        }
        return new TotalSearchCategoryResponse(page, categoryList.getTotalPages(), limit, categoryList1.size(), crudCategoryResponseList);
    }

    @Transactional
    public ResponseEntity<?> disableCategory(int cateId) {
        Category category = categoryRepository.findByCateId(cateId);
        if (category == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Category not found");
        }
        if (category.getIsDeleted()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Category already disabled");
        }

        // Fetch all products in the category
        List<Product> productList = productRepository.findByCategory_CateId(cateId);
        if (!productList.isEmpty()) {
            // Fetch all product IDs
            List<Integer> productIds = productList.stream()
                    .map(Product::getProId)
                    .toList();

            // Fetch all variants for products
            List<ProductVariants> productVariants = productVariantsRepository.findByProduct_ProIdIn(productIds);
            if (!productVariants.isEmpty()) {
                // Batch update variants
                productVariants.forEach(variant -> {
                    variant.setIsDeleted(true);
                    variant.setDateDeleted(LocalDateTime.now());
                });
                productVariantsRepository.saveAll(productVariants);

                // Fetch and batch update favourite items
                List<FavouriteItem> favouriteItems = favouriteItemRepository.findByProductVariantsIn(productVariants);
                if (!favouriteItems.isEmpty()) {
                    favouriteItems.forEach(item -> {
                        item.setIsDeleted(true);
                        item.setDateDeleted(LocalDateTime.now());
                    });
                    favouriteItemRepository.saveAll(favouriteItems);
                }

                // Fetch and batch update cart items
                List<CartItem> cartItems = cartItemRepository.findByProductVariantsIn(productVariants);
                if (!cartItems.isEmpty()) {
                    cartItems.forEach(item -> {
                        item.setIsDeleted(true);
                        item.setDateDeleted(LocalDateTime.now());
                    });
                    cartItemRepository.saveAll(cartItems);
                }
            }

            // Recalculate cart totals
            List<Cart> carts = cartRepository.findAll();
            carts.forEach(cart -> {
                List<CartItem> activeCartItems = cartItemRepository.findByCart_CartIdAndIsDeletedFalse(cart.getCartId());
                double total = activeCartItems.stream().mapToDouble(CartItem::getTotalPrice).sum();
                int quantity = activeCartItems.stream().mapToInt(CartItem::getQuantity).sum();

                cart.setTotalPrice(total);
                cart.setTotalProduct(quantity);
            });
            cartRepository.saveAll(carts);

            // Batch update reviews
            List<Review> reviews = reviewRepository.findAllByProduct_ProIdIn(productIds);
            if (!reviews.isEmpty()) {
                reviews.forEach(review -> {
                    review.setIsDeleted(true);
                    review.setDateDeleted(LocalDateTime.now());
                });
                reviewRepository.saveAll(reviews);
            }

            // Batch update products
            productList.forEach(product -> {
                product.setIsDeleted(true);
                product.setDateDeleted(LocalDateTime.now());
            });
            productRepository.saveAll(productList);
        }

        // Update category
        category.setIsDeleted(true);
        category.setDateDeleted(LocalDateTime.now());
        categoryRepository.save(category);

        // Return response
        return ResponseEntity.status(HttpStatus.OK).body(new CRUDCategoryResponse(
                category.getCateId(),
                category.getCateName(),
                category.getCateImg(),
                category.getIsDeleted(),
                category.getDateCreated(),
                category.getDateUpdated(),
                category.getDateDeleted()
        ));
    }


//    @Transactional
//    public ResponseEntity<?> disableCategory(int cateId)
//    {
//        Category category = categoryRepository.findByCateId(cateId);
//        if(category == null)
//        {
//            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("category not found");
//        }
//        if(category.getIsDeleted())
//        {
//            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Category already disable");
//        }
//        List<Product> productList = productRepository.findByCategory_CateId(cateId);
//        for (Product product: productList)
//        {
//            List<ProductVariants> productVariants = productVariantsRepository.findByProduct_ProId(product.getProId());
//            for(ProductVariants productVariant: productVariants)
//            {
//                productVariant.setIsDeleted(true);
//                productVariant.setDateDeleted(LocalDateTime.now());
//                productVariantsRepository.save(productVariant);
//
//                List<FavouriteItem> favouriteItems = favouriteItemRepository.findByProductVariants_VarId(productVariant.getVarId());
//                for(FavouriteItem favouriteItem: favouriteItems)
//                {
//                    favouriteItem.setIsDeleted(true);
//                    favouriteItem.setDateDeleted(LocalDateTime.now());
//                    favouriteItemRepository.save(favouriteItem);
//                }
//
//                List<CartItem> cartItems = cartItemRepository.findByProductVariants_VarId(productVariant.getVarId());
//                for(CartItem cartItem : cartItems)
//                {
//                    cartItem.setIsDeleted(true);
//                    cartItem.setDateDeleted(LocalDateTime.now());
//                    cartItemRepository.save(cartItem);
//                }
//                List<Cart> carts = cartRepository.findAll();
//                for(Cart cart : carts){
//                    List<CartItem> cartItems1 = cartItemRepository.findByCart_CartIdAndIsDeletedFalse(cart.getCartId());
//                    double total = 0.0 ;
//                    int quantity = 0;
//                    for(CartItem cartItem1 : cartItems1)
//                    {
//                        total += cartItem1.getTotalPrice();
//                        quantity += cartItem1.getQuantity();
//                    }
//                    cart.setTotalPrice(total);
//                    cart.setTotalProduct(quantity);
//
//                    cartRepository.save(cart);
//                }
//            }
//            List<Review> reviews = reviewRepository.findAllByProduct_ProId(product.getProId());
//            for(Review review: reviews)
//            {
//                review.setIsDeleted(true);
//                review.setDateDeleted(LocalDateTime.now());
//                reviewRepository.save(review);
//            }
//            product.setIsDeleted(true);
//            product.setDateDeleted(LocalDateTime.now());
//            productRepository.save(product);
//        }
//        category.setIsDeleted(true);
//        category.setDateDeleted(LocalDateTime.now());
//        categoryRepository.save(category);
//        return ResponseEntity.status(HttpStatus.OK).body(new CRUDCategoryResponse(
//                category.getCateId(),
//                category.getCateName(),
//                category.getCateImg(),
//                category.getIsDeleted(),
//                category.getDateCreated(),
//                category.getDateUpdated(),
//                category.getDateDeleted()));
//    }

//    @Transactional
//    public ResponseEntity<?> enableCategory(int cateId)
//    {
//        Category category = categoryRepository.findByCateId(cateId);
//        if(category == null)
//        {
//            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("category not found");
//        }
//        if(!category.getIsDeleted())
//        {
//            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Category already enable");
//        }
//        List<Product> productList = productRepository.findByCategory_CateId(cateId);
//        for (Product product:productList)
//        {
//            List<ProductVariants> productVariants = productVariantsRepository.findByProduct_ProId(product.getProId());
//            for(ProductVariants productVariant: productVariants)
//            {
//                productVariant.setIsDeleted(false);
//                productVariant.setDateDeleted(null);
//                productVariantsRepository.save(productVariant);
//                List<FavouriteItem> favouriteItems = favouriteItemRepository.findByProductVariants_VarId(productVariant.getVarId());
//                for(FavouriteItem favouriteItem: favouriteItems)
//                {
//                    favouriteItem.setIsDeleted(false);
//                    favouriteItem.setDateDeleted(null);
//                    favouriteItemRepository.save(favouriteItem);
//                }
//                List<CartItem> cartItems = cartItemRepository.findByProductVariants_VarId(productVariant.getVarId());
//                for(CartItem cartItem : cartItems)
//                {
//                    cartItem.setIsDeleted(false);
//                    cartItem.setDateDeleted(null);
//                    cartItemRepository.save(cartItem);
//                }
//                List<Cart> carts = cartRepository.findAll();
//                for(Cart cart : carts){
//                    List<CartItem> cartItems1 = cartItemRepository.findByCart_CartIdAndIsDeletedFalse(cart.getCartId());
//                    double total = 0.0 ;
//                    int quantity = 0;
//                    for(CartItem cartItem1 : cartItems1)
//                    {
//                        total += cartItem1.getTotalPrice();
//                        quantity += cartItem1.getQuantity();
//                    }
//                    cart.setTotalPrice(total);
//                    cart.setTotalProduct(quantity);
//
//                    cartRepository.save(cart);
//                }
//            }
//            List<Review> reviews = reviewRepository.findAllByProduct_ProId(product.getProId());
//            for(Review review: reviews)
//            {
//                review.setIsDeleted(false);
//                review.setDateDeleted(null);
//                reviewRepository.save(review);
//            }
//            product.setIsDeleted(false);
//            product.setDateDeleted(null);
//            productRepository.save(product);
//        }
//        category.setIsDeleted(false);
//        category.setDateDeleted(null);
//        categoryRepository.save(category);
//        return ResponseEntity.status(HttpStatus.OK).body(new CRUDCategoryResponse(
//                category.getCateId(),
//                category.getCateName(),
//                category.getCateImg(),
//                category.getIsDeleted(),
//                category.getDateCreated(),
//                category.getDateUpdated(),
//                category.getDateDeleted()));
//    }

    @Transactional
    public ResponseEntity<?> enableCategory(int cateId, boolean isCancel) throws SQLException {
        if (isCancel) {
            throw new SQLException("Cancel requested, rolling back changes.");
        }
        Category category = categoryRepository.findByCateId(cateId);
        if (category == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Category not found");
        }

        if (!category.getIsDeleted()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Category already enabled");
        }

        // Fetch all products in the category
        List<Product> productList = productRepository.findByCategory_CateId(cateId);
        if (!productList.isEmpty()) {
            List<Integer> productIds = productList.stream()
                    .map(Product::getProId)
                    .collect(Collectors.toList());

            // Fetch product variants related to the products
            List<ProductVariants> productVariants = productVariantsRepository.findByProduct_ProIdIn(productIds);
            if (!productVariants.isEmpty()) {
                // Batch update variants
                productVariants.forEach(variant -> {
                    variant.setIsDeleted(false);
                    variant.setDateDeleted(null);
                });
                productVariantsRepository.saveAll(productVariants);

                // Fetch and batch update favourite items
                List<FavouriteItem> favouriteItems = favouriteItemRepository.findByProductVariantsIn(productVariants);
                if (!favouriteItems.isEmpty()) {
                    favouriteItems.forEach(item -> {
                        item.setIsDeleted(false);
                        item.setDateDeleted(null);
                    });
                    favouriteItemRepository.saveAll(favouriteItems);
                }

                // Fetch and batch update cart items
                List<CartItem> cartItems = cartItemRepository.findByProductVariantsIn(productVariants);
                if (!cartItems.isEmpty()) {
                    cartItems.forEach(item -> {
                        item.setIsDeleted(false);
                        item.setDateDeleted(null);
                    });
                    cartItemRepository.saveAll(cartItems);
                }
            }

            // Recalculate cart totals
            List<Cart> carts = cartRepository.findAll();
            carts.forEach(cart -> {
                List<CartItem> activeCartItems = cartItemRepository.findByCart_CartIdAndIsDeletedFalse(cart.getCartId());
                double total = activeCartItems.stream().mapToDouble(CartItem::getTotalPrice).sum();
                int quantity = activeCartItems.stream().mapToInt(CartItem::getQuantity).sum();

                cart.setTotalPrice(total);
                cart.setTotalProduct(quantity);
            });
            cartRepository.saveAll(carts);

            // Batch update reviews
            List<Review> reviews = reviewRepository.findAllByProduct_ProIdIn(productIds);
            if (!reviews.isEmpty()) {
                reviews.forEach(review -> {
                    review.setIsDeleted(false);
                    review.setDateDeleted(null);
                });
                reviewRepository.saveAll(reviews);
            }

            // Batch update products
            productList.forEach(product -> {
                product.setIsDeleted(false);
                product.setDateDeleted(null);
            });
            productRepository.saveAll(productList);
        }

        // Update category
        category.setIsDeleted(false);
        category.setDateDeleted(null);
        categoryRepository.save(category);



        return ResponseEntity.status(HttpStatus.OK).body(new CRUDCategoryResponse(
                category.getCateId(),
                category.getCateName(),
                category.getCateImg(),
                category.getIsDeleted(),
                category.getDateCreated(),
                category.getDateUpdated(),
                category.getDateDeleted()
        ));
    }
}
//    private Map<String, Boolean> transactionStatus = new HashMap<>();
//    @Transactional
//    @Async
//    public CompletableFuture<ResponseEntity<?>> enableCategory(int cateId, boolean isCancel,String transactionToken) {
//        // Tín hiệu hủy, sẽ được kiểm tra trong quá trình thực hiện các bước
//        AtomicBoolean cancelFlag = new AtomicBoolean(isCancel);
//
//        if (isCancel) {
//            transactionStatus.put(transactionToken, true);
//            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
//            return CompletableFuture.completedFuture(ResponseEntity.status(HttpStatus.OK).body("Operation cancelled and rolled back"));
//        }
//        transactionStatus.put(transactionToken, false);
//        Category category = categoryRepository.findByCateId(cateId);
//        if (category == null) {
//            return CompletableFuture.completedFuture(ResponseEntity.status(HttpStatus.NOT_FOUND).body("Category not found"));
//        }
//        if (!category.getIsDeleted()) {
//            return CompletableFuture.completedFuture(ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Category already enabled"));
//        }
//
//        // Fetch all products in the category
//        List<Product> productList = productRepository.findByCategory_CateId(cateId);
//        if (!productList.isEmpty()) {
//            List<Integer> productIds = productList.stream()
//                    .map(Product::getProId)
//                    .toList();
//            List<ProductVariants> productVariants = productVariantsRepository.findByProduct_ProIdIn(productIds);
//
//            if (!productVariants.isEmpty()) {
//                // Batch update variants
//                productVariants.forEach(variant -> {
//                    if (cancelFlag.get()) return;
//                    variant.setIsDeleted(false);
//                    variant.setDateDeleted(null);
//                });
//                if (!cancelFlag.get()) productVariantsRepository.saveAll(productVariants);
//
//                // Fetch and batch update favourite items
//                List<FavouriteItem> favouriteItems = favouriteItemRepository.findByProductVariantsIn(productVariants);
//                if (!favouriteItems.isEmpty()) {
//                    favouriteItems.forEach(item -> {
//                        if (cancelFlag.get()) return;
//                        item.setIsDeleted(false);
//                        item.setDateDeleted(null);
//                    });
//                    if (!cancelFlag.get()) favouriteItemRepository.saveAll(favouriteItems);
//                }
//
//                // Fetch and batch update cart items
//                List<CartItem> cartItems = cartItemRepository.findByProductVariantsIn(productVariants);
//                if (!cartItems.isEmpty()) {
//                    cartItems.forEach(item -> {
//                        if (cancelFlag.get()) return;
//                        item.setIsDeleted(false);
//                        item.setDateDeleted(null);
//                    });
//                    if (!cancelFlag.get()) cartItemRepository.saveAll(cartItems);
//                }
//            }
//
//            // Recalculate cart totals
//            List<Cart> carts = cartRepository.findAll();
//            carts.forEach(cart -> {
//                if (cancelFlag.get()) return;
//                List<CartItem> activeCartItems = cartItemRepository.findByCart_CartIdAndIsDeletedFalse(cart.getCartId());
//                double total = activeCartItems.stream().mapToDouble(CartItem::getTotalPrice).sum();
//                int quantity = activeCartItems.stream().mapToInt(CartItem::getQuantity).sum();
//
//                cart.setTotalPrice(total);
//                cart.setTotalProduct(quantity);
//            });
//            if (!cancelFlag.get()) cartRepository.saveAll(carts);
//
//            // Batch update reviews
//            List<Review> reviews = reviewRepository.findAllByProduct_ProIdIn(productIds);
//            if (!reviews.isEmpty()) {
//                reviews.forEach(review -> {
//                    if (cancelFlag.get()) return;
//                    review.setIsDeleted(false);
//                    review.setDateDeleted(null);
//                });
//                if (!cancelFlag.get()) reviewRepository.saveAll(reviews);
//            }
//
//            // Batch update products
//            productList.forEach(product -> {
//                if (cancelFlag.get()) return;
//                product.setIsDeleted(false);
//                product.setDateDeleted(null);
//            });
//            if (!cancelFlag.get()) productRepository.saveAll(productList);
//        }
//
//        // Update category
//        if (!cancelFlag.get()) {
//            category.setIsDeleted(false);
//            category.setDateDeleted(null);
//            categoryRepository.save(category);
//        }
//
//
//        // Return response
//        return CompletableFuture.completedFuture(ResponseEntity.status(HttpStatus.OK).body(new CRUDCategoryResponse(
//                category.getCateId(),
//                category.getCateName(),
//                category.getCateImg(),
//                category.getIsDeleted(),
//                category.getDateCreated(),
//                category.getDateUpdated(),
//                category.getDateDeleted()
//        )));
//    }
//
//
//
//}