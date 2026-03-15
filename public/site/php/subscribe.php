<?php
header('Content-Type: application/json');

// 🔑 Replace with your Mailchimp details
$apiKey = 'YOUR_API_KEY';
$listId = 'YOUR_LIST_ID';
$dataCenter = substr($apiKey,strpos($apiKey,'-')+1); // e.g. "us21"

// Get form data
$email = $_POST['EMAIL'] ?? '';
$consent = $_POST['gdpr']['email'] ?? '';

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Invalid email address.']);
    exit;
}

// Prepare subscriber data
$memberId = md5(strtolower($email));
$url = "https://$dataCenter.api.mailchimp.com/3.0/lists/$listId/members/$memberId";

$json = json_encode([
    'email_address' => $email,
    'status_if_new' => 'subscribed',
    'status' => 'subscribed',
    'marketing_permissions' => [
        [
            'marketing_permission_id' => 'YOUR_PERMISSION_ID', // from Mailchimp audience settings
            'enabled' => ($consent === 'Y')
        ]
    ]
]);

// Send request
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_USERPWD, 'user:' . $apiKey);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
curl_setopt($ch, CURLOPT_POSTFIELDS, $json);
$result = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode == 200) {
    echo json_encode(['success' => true, 'message' => 'Thanks for subscribing!']);
} else {
    echo json_encode(['success' => false, 'message' => 'Subscription failed.']);
}

