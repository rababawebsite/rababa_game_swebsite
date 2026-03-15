<?php
/**
 * Secure Contact Form Handler
 * Handles form submission with validation, sanitization, and security measures
 */

// Security headers
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// Start session for rate limiting
session_start();

/**
 * Configuration - Update these settings for your environment
 */
$config = [
    'to_email' => 'Your email here',
    'from_email' => 'Your email here',
    'subject' => 'New Message From Your Website',
    'rate_limit_seconds' => 30,
    'max_message_length' => 1000,
    'max_name_length' => 50,
    'max_email_length' => 254
];

/**
 * Response function
 */
function sendResponse($success, $message, $httpCode = 200) {
    http_response_code($httpCode);
    echo json_encode(['success' => $success, 'message' => $message]);
    exit;
}

/**
 * Input sanitization
 */
function sanitizeInput($input, $maxLength = null) {
    $sanitized = trim($input);
    $sanitized = strip_tags($sanitized);
    $sanitized = htmlspecialchars($sanitized, ENT_QUOTES, 'UTF-8');
    
    if ($maxLength && strlen($sanitized) > $maxLength) {
        $sanitized = substr($sanitized, 0, $maxLength);
    }
    
    return $sanitized;
}

/**
 * Email validation
 */
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Rate limiting check
 */
function checkRateLimit($seconds) {
    $key = 'last_contact_form_submission';
    $now = time();
    
    if (isset($_SESSION[$key])) {
        $timeDiff = $now - $_SESSION[$key];
        if ($timeDiff < $seconds) {
            return false;
        }
    }
    
    $_SESSION[$key] = $now;
    return true;
}

/**
 * Spam detection
 */
function detectSpam($name, $email, $message) {
    // Check for suspicious patterns
    $spamPatterns = [
        '/\b(viagra|cialis|casino|poker|loan|mortgage|crypto|bitcoin)\b/i',
        '/https?:\/\/[^\s]+/i', // URLs in message
        '/\b\d{10,}\b/', // Long numbers (phone numbers)
    ];
    
    $combinedText = $name . ' ' . $email . ' ' . $message;
    
    foreach ($spamPatterns as $pattern) {
        if (preg_match($pattern, $combinedText)) {
            return true;
        }
    }
    
    // Check for excessive repetition
    if (substr_count(strtolower($message), strtolower($name)) > 3) {
        return true;
    }
    
    return false;
}

// Only accept POST requests with AJAX header
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, 'Invalid request method', 405);
}

if (!isset($_SERVER['HTTP_X_REQUESTED_WITH']) || $_SERVER['HTTP_X_REQUESTED_WITH'] !== 'XMLHttpRequest') {
    sendResponse(false, 'Invalid request', 400);
}

// Check rate limiting
if (!checkRateLimit($config['rate_limit_seconds'])) {
    sendResponse(false, 'Too many requests. Please wait before submitting again.', 429);
}

// Get and validate input data
$name = isset($_POST['name']) ? sanitizeInput($_POST['name'], $config['max_name_length']) : '';
$email = isset($_POST['email']) ? sanitizeInput($_POST['email'], $config['max_email_length']) : '';
$message = isset($_POST['message']) ? sanitizeInput($_POST['message'], $config['max_message_length']) : '';

// Validation
$errors = [];

// Name validation
if (empty($name)) {
    $errors[] = 'Name is required';
} elseif (strlen($name) < 2) {
    $errors[] = 'Name must be at least 2 characters long';
} elseif (!preg_match('/^[a-zA-Z\s\-\']+$/', $name)) {
    $errors[] = 'Name contains invalid characters';
}

// Email validation
if (empty($email)) {
    $errors[] = 'Email is required';
} elseif (!validateEmail($email)) {
    $errors[] = 'Invalid email address';
}

// Message validation
if (empty($message)) {
    $errors[] = 'Message is required';
} elseif (strlen($message) < 10) {
    $errors[] = 'Message must be at least 10 characters long';
}

// Check for spam
if (detectSpam($name, $email, $message)) {
    // Log potential spam attempt
    error_log('Potential spam detected from: ' . $_SERVER['REMOTE_ADDR']);
    sendResponse(false, 'Message appears to be spam', 400);
}

// If there are validation errors, return them
if (!empty($errors)) {
    sendResponse(false, implode(', ', $errors), 400);
}

// Prepare email
$emailSubject = $config['subject'];
$emailBody = "New contact form submission:\n\n";
$emailBody .= "Name: " . $name . "\n";
$emailBody .= "Email: " . $email . "\n";
$emailBody .= "Message:\n" . $message . "\n\n";
$emailBody .= "---\n";
$emailBody .= "Submitted from: " . $_SERVER['HTTP_HOST'] . "\n";
$emailBody .= "IP Address: " . $_SERVER['REMOTE_ADDR'] . "\n";
$emailBody .= "User Agent: " . $_SERVER['HTTP_USER_AGENT'] . "\n";
$emailBody .= "Date: " . date('Y-m-d H:i:s') . "\n";

// Email headers
$headers = [
    'From: ' . $config['from_email'],
    'Reply-To: ' . $email,
    'Return-Path: ' . $config['from_email'],
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: PHP/' . phpversion(),
    'X-Originating-IP: ' . $_SERVER['REMOTE_ADDR']
];

// Send email
$mailSent = mail($config['to_email'], $emailSubject, $emailBody, implode("\r\n", $headers));

if ($mailSent) {
    // Log successful submission
    error_log('Contact form submission from: ' . $email . ' (' . $_SERVER['REMOTE_ADDR'] . ')');
    sendResponse(true, 'Thank you! Your message has been sent successfully.');
} else {
    // Log email failure
    error_log('Failed to send contact form email from: ' . $email);
    sendResponse(false, 'Sorry, there was an error sending your message. Please try again later.', 500);
}
?>