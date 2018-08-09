<?php
require 'vendor/autoload.php';
use Corneltek\Preview\Preview;
use Corneltek\Preview\ConfigLoader;

function getPathInfo()
{
    if ( isset($_SERVER['PATH_INFO']) ) {
        return ltrim($_SERVER['PATH_INFO'],'/');
    }
}

$config = new ConfigLoader;
$config->loadFileIfExists('config/preview.yml');

$path = getPathInfo();
if ( ! $path ) {
    // redirect to design by default.
    header('Location: preview.php/design/');
}

$preview = new Preview($config->stash);
$preview->dispatch($path);
