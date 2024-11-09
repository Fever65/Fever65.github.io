<?php

$boutons = [
    "Page 1- Test" => "index.php",
    "Page 2 - Encore un test" => "p2.php"
];
?>

<header>
    <nav>
        <?php foreach ($boutons as $label => $link) : ?>
            <a href="<?php echo $link; ?>" class="boutons"><?php echo $label; ?></a>
        <?php endforeach; ?>
    </nav>
</header>
