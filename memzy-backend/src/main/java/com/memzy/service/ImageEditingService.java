package com.memzy.service;

import net.coobird.thumbnailator.Thumbnails;
import net.coobird.thumbnailator.filters.ImageFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.awt.image.ColorConvertOp;
import java.awt.image.RescaleOp;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class ImageEditingService {

    private static final Logger logger = LoggerFactory.getLogger(ImageEditingService.class);

    @Value("${memzy.storage.original-path}")
    private String storagePath;

    public File cropImage(File sourceFile, int x, int y, int width, int height) throws IOException {
        BufferedImage originalImage = ImageIO.read(sourceFile);

        // Validate crop dimensions
        if (x < 0 || y < 0 || width <= 0 || height <= 0 ||
                x + width > originalImage.getWidth() || y + height > originalImage.getHeight()) {
            throw new IllegalArgumentException("Invalid crop dimensions");
        }

        BufferedImage croppedImage = originalImage.getSubimage(x, y, width, height);

        // Save cropped image
        String newFileName = "edited_" + UUID.randomUUID().toString() + ".jpg";
        Path outputPath = Paths.get(storagePath, newFileName);
        File outputFile = outputPath.toFile();

        ImageIO.write(croppedImage, "jpg", outputFile);
        logger.info("Cropped image saved: {}", outputPath);

        return outputFile;
    }

    public File rotateImage(File sourceFile, double degrees) throws IOException {
        BufferedImage originalImage = ImageIO.read(sourceFile);

        int width = originalImage.getWidth();
        int height = originalImage.getHeight();

        // Calculate new dimensions after rotation
        double radians = Math.toRadians(degrees);
        double sin = Math.abs(Math.sin(radians));
        double cos = Math.abs(Math.cos(radians));

        int newWidth = (int) Math.floor(width * cos + height * sin);
        int newHeight = (int) Math.floor(height * cos + width * sin);

        // Create rotated image
        BufferedImage rotatedImage = new BufferedImage(newWidth, newHeight, originalImage.getType());
        Graphics2D g2d = rotatedImage.createGraphics();

        // Set rendering hints for better quality
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        // Rotate around center
        g2d.translate((newWidth - width) / 2, (newHeight - height) / 2);
        g2d.rotate(radians, width / 2.0, height / 2.0);
        g2d.drawImage(originalImage, 0, 0, null);
        g2d.dispose();

        // Save rotated image
        String newFileName = "edited_" + UUID.randomUUID().toString() + ".jpg";
        Path outputPath = Paths.get(storagePath, newFileName);
        File outputFile = outputPath.toFile();

        ImageIO.write(rotatedImage, "jpg", outputFile);
        logger.info("Rotated image saved: {}", outputPath);

        return outputFile;
    }

    public File flipImage(File sourceFile, boolean horizontal) throws IOException {
        BufferedImage originalImage = ImageIO.read(sourceFile);

        int width = originalImage.getWidth();
        int height = originalImage.getHeight();

        BufferedImage flippedImage = new BufferedImage(width, height, originalImage.getType());
        Graphics2D g2d = flippedImage.createGraphics();

        if (horizontal) {
            // Flip horizontally
            g2d.drawImage(originalImage, 0, 0, width, height, width, 0, 0, height, null);
        } else {
            // Flip vertically
            g2d.drawImage(originalImage, 0, 0, width, height, 0, height, width, 0, null);
        }

        g2d.dispose();

        // Save flipped image
        String newFileName = "edited_" + UUID.randomUUID().toString() + ".jpg";
        Path outputPath = Paths.get(storagePath, newFileName);
        File outputFile = outputPath.toFile();

        ImageIO.write(flippedImage, "jpg", outputFile);
        logger.info("Flipped image saved: {}", outputPath);

        return outputFile;
    }

    public File adjustBrightness(File sourceFile, float brightness) throws IOException {
        BufferedImage originalImage = ImageIO.read(sourceFile);

        // Brightness adjustment using RescaleOp
        // brightness: -1.0 to 1.0 (0 = no change)
        float scaleFactor = 1.0f + brightness;
        float offset = 0;

        RescaleOp rescaleOp = new RescaleOp(scaleFactor, offset, null);
        BufferedImage brightenedImage = rescaleOp.filter(originalImage, null);

        // Save adjusted image
        String newFileName = "edited_" + UUID.randomUUID().toString() + ".jpg";
        Path outputPath = Paths.get(storagePath, newFileName);
        File outputFile = outputPath.toFile();

        ImageIO.write(brightenedImage, "jpg", outputFile);
        logger.info("Brightness adjusted image saved: {}", outputPath);

        return outputFile;
    }

    public File adjustContrast(File sourceFile, float contrast) throws IOException {
        BufferedImage originalImage = ImageIO.read(sourceFile);

        // Contrast adjustment using RescaleOp
        // contrast: -1.0 to 1.0 (0 = no change)
        float scaleFactor = 1.0f + contrast;
        float offset = 128 * (1 - scaleFactor);

        RescaleOp rescaleOp = new RescaleOp(scaleFactor, offset, null);
        BufferedImage contrastedImage = rescaleOp.filter(originalImage, null);

        // Save adjusted image
        String newFileName = "edited_" + UUID.randomUUID().toString() + ".jpg";
        Path outputPath = Paths.get(storagePath, newFileName);
        File outputFile = outputPath.toFile();

        ImageIO.write(contrastedImage, "jpg", outputFile);
        logger.info("Contrast adjusted image saved: {}", outputPath);

        return outputFile;
    }

    public File applyGrayscaleFilter(File sourceFile) throws IOException {
        BufferedImage originalImage = ImageIO.read(sourceFile);

        // Convert to grayscale
        BufferedImage grayscaleImage = new BufferedImage(
                originalImage.getWidth(),
                originalImage.getHeight(),
                BufferedImage.TYPE_BYTE_GRAY
        );

        Graphics2D g2d = grayscaleImage.createGraphics();
        g2d.drawImage(originalImage, 0, 0, null);
        g2d.dispose();

        // Save grayscale image
        String newFileName = "edited_" + UUID.randomUUID().toString() + ".jpg";
        Path outputPath = Paths.get(storagePath, newFileName);
        File outputFile = outputPath.toFile();

        ImageIO.write(grayscaleImage, "jpg", outputFile);
        logger.info("Grayscale filter applied and saved: {}", outputPath);

        return outputFile;
    }

    public File applySepiaFilter(File sourceFile) throws IOException {
        BufferedImage originalImage = ImageIO.read(sourceFile);

        int width = originalImage.getWidth();
        int height = originalImage.getHeight();

        BufferedImage sepiaImage = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);

        // Apply sepia tone
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int rgb = originalImage.getRGB(x, y);

                int r = (rgb >> 16) & 0xff;
                int g = (rgb >> 8) & 0xff;
                int b = rgb & 0xff;

                // Sepia formula
                int tr = (int) (0.393 * r + 0.769 * g + 0.189 * b);
                int tg = (int) (0.349 * r + 0.686 * g + 0.168 * b);
                int tb = (int) (0.272 * r + 0.534 * g + 0.131 * b);

                // Clamp values
                tr = Math.min(255, tr);
                tg = Math.min(255, tg);
                tb = Math.min(255, tb);

                int newRgb = (tr << 16) | (tg << 8) | tb;
                sepiaImage.setRGB(x, y, newRgb);
            }
        }

        // Save sepia image
        String newFileName = "edited_" + UUID.randomUUID().toString() + ".jpg";
        Path outputPath = Paths.get(storagePath, newFileName);
        File outputFile = outputPath.toFile();

        ImageIO.write(sepiaImage, "jpg", outputFile);
        logger.info("Sepia filter applied and saved: {}", outputPath);

        return outputFile;
    }

    public File resizeImage(File sourceFile, int targetWidth, int targetHeight) throws IOException {
        String newFileName = "edited_" + UUID.randomUUID().toString() + ".jpg";
        Path outputPath = Paths.get(storagePath, newFileName);
        File outputFile = outputPath.toFile();

        Thumbnails.of(sourceFile)
                .size(targetWidth, targetHeight)
                .outputFormat("jpg")
                .outputQuality(0.9)
                .toFile(outputFile);

        logger.info("Resized image saved: {}", outputPath);

        return outputFile;
    }
}
