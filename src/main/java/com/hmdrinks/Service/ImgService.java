package com.hmdrinks.Service;

import com.hmdrinks.Entity.User;
import com.hmdrinks.Entity.UserInfo;
import com.hmdrinks.Exception.BadRequestException;
import com.hmdrinks.Exception.NotFoundException;
import com.hmdrinks.Repository.UserInfoRepository;
import com.hmdrinks.Repository.UserRepository;
import com.hmdrinks.Response.ImgResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import com.cloudinary.*;
import com.cloudinary.utils.ObjectUtils;
import io.github.cdimascio.dotenv.Dotenv;

import java.io.File;
import java.io.InputStream;
import java.util.Map;

import java.io.IOException;
import java.util.Optional;

@Service
public class ImgService {

    @Autowired
    private UserInfoRepository userInfoRepository;

    @Autowired
    private UserRepository userRepository;

    public ImgResponse uploadImgUser(MultipartFile multipartFile, int userId) throws IOException {

        if (!processFile(multipartFile)) {
            throw new BadRequestException("Incorrect formatting");
        }


        User users = userRepository.findByUserId(userId);
        if (users == null) {
            throw new NotFoundException("Not found userId");
        }


        Cloudinary cloudinary = new Cloudinary("cloudinary://975419637137491:VccYpUAKe_dpLQX3alPlB-OGJgc@dwkklrxyj");
        cloudinary.config.secure = true;

        try {
            InputStream inputStream = multipartFile.getInputStream();
            Map<String, Object> params = ObjectUtils.asMap(
                    "use_filename", true,
                    "unique_filename", false,
                    "overwrite", true
            );
            File tempFile = File.createTempFile("upload-", ".tmp");
            multipartFile.transferTo(tempFile);
            Map<String, Object> uploadResult = cloudinary.uploader().upload(tempFile, params);
            String imageUrl = (String) uploadResult.get("secure_url");
            ImgResponse imgResponse = new ImgResponse();
            imgResponse.setUrl(imageUrl);
            UserInfo userInfo = userInfoRepository.findByUserUserId(userId);
            if(userInfo == null){
                throw  new RuntimeException("Khong ton tai userId");
            }
            userInfo.setAvatar(imageUrl);
            userInfoRepository.save(userInfo);

            return imgResponse;

        } catch (Exception e) {
            System.out.println("Error uploading image: " + e.getMessage());
            throw new IOException("Could not upload image: " + e.getMessage());
        }
    }

    public boolean processFile(MultipartFile file) {
        String originalFilename = file.getOriginalFilename();
        String contentType = file.getContentType();

        if (originalFilename != null) {
           if (originalFilename.endsWith(".jpg") ||
                    originalFilename.endsWith(".png") ||
                    originalFilename.endsWith(".jpeg") ||
                    originalFilename.endsWith(".raw") ||
                    originalFilename.endsWith(".psd") ||
                    originalFilename.endsWith(".tif") ||
                    originalFilename.endsWith(".tiff") ||
                    originalFilename.endsWith(".gif") ||
                    originalFilename.endsWith(".webp") ||
                    originalFilename.endsWith(".bmp") ||
                    originalFilename.endsWith(".heif") ||
                    originalFilename.endsWith(".xcf") ||
                    contentType.startsWith("image/")) {
                return true;
            }
        }
        return false;
    }
}

