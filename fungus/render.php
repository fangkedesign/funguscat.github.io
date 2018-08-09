#!/usr/bin/env php
<?php
require_once 'vendor/autoload.php';
use Corneltek\Preview\TaskRunner;
use Corneltek\Preview\ConfigLoader;

define('ENABLE_JAVA_I18N_FILTER', true);

$config = new ConfigLoader;
$config->loadFileIfExists('config/preview.yml');

$runner = new TaskRunner($config->stash);
$runner->run();
echo "\nDone\n";
